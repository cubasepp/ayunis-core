import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { listMistralModels } from '@ayunis/provider-mistral';
import { MistralModelCatalog } from 'src/domain/models/application/ports/mistral-model-catalog';
import type { ProviderModelListing } from 'src/domain/models/application/models/provider-model-listing';

@Injectable()
export class SdkMistralModelCatalog extends MistralModelCatalog {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  list(): Promise<ProviderModelListing[]> {
    return listMistralModels({
      apiKey: this.configService.get<string>('models.mistral.apiKey') ?? '',
      baseUrl: this.configService.get<string>('models.mistral.modelsServerUrl'),
    });
  }
}
