import type { ModelPrice } from 'src/domain/models/application/models/model-price';
import type { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';

export abstract class ModelPriceList {
  /** Public list prices in USD, keyed by the provider's model identifier. */
  abstract findUsdListPrices(
    provider: ModelProvider,
  ): Promise<ReadonlyMap<string, ModelPrice>>;
}
