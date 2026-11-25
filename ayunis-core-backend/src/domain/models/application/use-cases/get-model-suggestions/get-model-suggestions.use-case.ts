import { Injectable, Logger } from '@nestjs/common';
import { HandleUnexpectedErrors } from 'src/common/decorators/handle-unexpected-errors.decorator';
import type { ProviderModelCatalog } from 'src/domain/models/application/ports/provider-model-catalog';
import { ProviderModelCatalogRegistry } from 'src/domain/models/application/registry/provider-model-catalog.registry';
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
export class GetModelSuggestionsUseCase {
  private readonly logger = new Logger(GetModelSuggestionsUseCase.name);

  constructor(
    private readonly catalogRegistry: ProviderModelCatalogRegistry,
    private readonly modelsRepository: ModelsRepository,
    private readonly priceSuggestions: ModelPriceSuggestionService,
  ) {}

  @HandleUnexpectedErrors(UnexpectedModelError)
  async execute(provider: ModelProvider): Promise<ModelSuggestion[]> {
    this.logger.log({ provider }, 'execute');
    const catalog = this.catalogRegistry.find(provider);
    if (!catalog) return [];
    const listings = await this.listModels(provider, catalog);
    const [catalogNames, findPrice] = await Promise.all([
      this.findCatalogNames(provider),
      this.priceSuggestions.createPriceLookup(provider),
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

  private async listModels(
    provider: ModelProvider,
    catalog: ProviderModelCatalog,
  ): Promise<ProviderModelListing[]> {
    if (!catalog.isConfigured()) {
      throw new ProviderModelListNotConfiguredError(provider);
    }
    try {
      return await catalog.list();
    } catch (error) {
      this.logger.warn(
        {
          provider,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Provider could not list models',
      );
      throw new ProviderModelListFailedError(provider);
    }
  }

  private async findCatalogNames(
    provider: ModelProvider,
  ): Promise<Set<string>> {
    const models = await this.modelsRepository.findAll();
    return new Set(
      models
        .filter(
          (model) =>
            model instanceof LanguageModel && model.provider === provider,
        )
        .map((model) => model.name),
    );
  }
}
