import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { listMistralModels } from '@ayunis/provider-mistral';
import { ProviderModelCatalog } from 'src/domain/models/application/ports/provider-model-catalog';
import type { ProviderModelListing } from 'src/domain/models/application/models/provider-model-listing';

@Injectable()
export class SdkMistralModelCatalog extends ProviderModelCatalog {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return !!this.configService.get<string>('models.mistral.apiKey')?.trim();
  }

  list(): Promise<ProviderModelListing[]> {
    return listMistralModels({
      apiKey: this.configService.get<string>('models.mistral.apiKey') ?? '',
      baseUrl: this.configService.get<string>('models.mistral.modelsServerUrl'),
    });
  }
}
