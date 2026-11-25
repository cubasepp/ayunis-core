import type { ProviderModelListing } from 'src/domain/models/application/models/provider-model-listing';

export abstract class MistralModelCatalog {
  abstract list(): Promise<ProviderModelListing[]>;
}
