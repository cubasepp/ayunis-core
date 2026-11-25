import type { ProviderModelListing } from 'src/domain/models/application/models/provider-model-listing';

export abstract class ProviderModelCatalog {
  abstract isConfigured(): boolean;
  abstract list(): Promise<ProviderModelListing[]>;
}
