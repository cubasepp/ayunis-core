import { Injectable } from '@nestjs/common';
import { ModelPriceList } from 'src/domain/models/application/ports/model-price-list';
import type { ModelPrice } from 'src/domain/models/application/models/model-price';
import type { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';

const PRICE_LIST_URL = 'https://models.dev/api.json';
const TIMEOUT_MS = 10_000;

type PriceListDocument = Partial<
  Record<
    string,
    {
      models?: Record<
        string,
        { cost?: { input?: unknown; output?: unknown } } | undefined
      >;
    }
  >
>;

const isPrice = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** Community-maintained list prices from https://models.dev. */
@Injectable()
export class ModelsDevPriceList extends ModelPriceList {
  async findUsdListPrices(
    provider: ModelProvider,
  ): Promise<ReadonlyMap<string, ModelPrice>> {
    const response = await fetch(PRICE_LIST_URL, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Price list request failed with ${response.status}`);
    }
    const document = (await response.json()) as PriceListDocument;
    const prices = new Map<string, ModelPrice>();
    for (const [name, model] of Object.entries(
      document[provider]?.models ?? {},
    )) {
      const { input, output } = model?.cost ?? {};
      if (isPrice(input) && isPrice(output)) {
        prices.set(name, { inputTokenCost: input, outputTokenCost: output });
      }
    }
    return prices;
  }
}
