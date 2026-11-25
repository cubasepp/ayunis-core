import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HandleUnexpectedErrors } from 'src/common/decorators/handle-unexpected-errors.decorator';
import { MistralModelCatalog } from 'src/domain/models/application/ports/mistral-model-catalog';
import { ModelsRepository } from 'src/domain/models/application/ports/models.repository';
import { ModelPriceSuggestionService } from 'src/domain/models/application/services/model-price-suggestion.service';
import { groupModelListings } from 'src/domain/models/application/helpers/group-model-listings.helper';
import { formatModelDisplayName } from 'src/domain/models/application/helpers/format-model-display-name.helper';
import type { ModelSuggestion } from 'src/domain/models/application/models/model-suggestion';
import type { ProviderModelListing } from 'src/domain/models/application/models/provider-model-listing';
import { LanguageModel } from 'src/domain/models/domain/models/language.model';
import { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';
import { UnexpectedModelError } from 'src/domain/models/application/models.errors';
import {
  ProviderModelListFailedError,
  ProviderModelListNotConfiguredError,
} from 'src/domain/models/application/model-suggestion.errors';

@Injectable()
export class GetMistralModelSuggestionsUseCase {
  private readonly logger = new Logger(GetMistralModelSuggestionsUseCase.name);

  constructor(
    private readonly mistralModelCatalog: MistralModelCatalog,
    private readonly modelsRepository: ModelsRepository,
    private readonly priceSuggestions: ModelPriceSuggestionService,
    private readonly configService: ConfigService,
  ) {}

  @HandleUnexpectedErrors(UnexpectedModelError)
  async execute(): Promise<ModelSuggestion[]> {
    this.logger.log('execute');
    const listings = await this.listModels();
    const [catalogNames, findPrice] = await Promise.all([
      this.findCatalogNames(),
      this.priceSuggestions.createMistralPriceLookup(),
    ]);

    return groupModelListings(listings)
      .filter(({ listing }) => listing.supportsChat)
      .map(({ name, identifiers, listing }) => ({
        name,
        displayName: formatModelDisplayName(name),
        contextWindowSize: listing.contextWindowSize,
        canUseTools: listing.supportsTools,
        canVision: listing.supportsVision,
        isReasoning: listing.supportsReasoning,
        isInCatalog: identifiers.some((id) => catalogNames.has(id)),
        price: findPrice([name, ...identifiers]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async listModels(): Promise<ProviderModelListing[]> {
    if (!this.configService.get<string>('models.mistral.apiKey')?.trim()) {
      throw new ProviderModelListNotConfiguredError(ModelProvider.MISTRAL);
    }
    try {
      return await this.mistralModelCatalog.list();
    } catch (error) {
      this.logger.warn(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Mistral could not list models',
      );
      throw new ProviderModelListFailedError(ModelProvider.MISTRAL);
    }
  }

  private async findCatalogNames(): Promise<Set<string>> {
    const models = await this.modelsRepository.findAll();
    return new Set(
      models
        .filter(
          (model) =>
            model instanceof LanguageModel &&
            model.provider === ModelProvider.MISTRAL,
        )
        .map((model) => model.name),
    );
  }
}
