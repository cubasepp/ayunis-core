import { Injectable } from '@nestjs/common';
import type { ProviderModelCatalog } from 'src/domain/models/application/ports/provider-model-catalog';
import type { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';

/**
 * Providers that can list their models. A provider without an entry has no
 * model list to prefill from, which is not an error.
 */
@Injectable()
export class ProviderModelCatalogRegistry {
  private readonly catalogs = new Map<ModelProvider, ProviderModelCatalog>();

  register(provider: ModelProvider, catalog: ProviderModelCatalog): void {
    this.catalogs.set(provider, catalog);
  }

  find(provider: ModelProvider): ProviderModelCatalog | undefined {
    return this.catalogs.get(provider);
  }
}
