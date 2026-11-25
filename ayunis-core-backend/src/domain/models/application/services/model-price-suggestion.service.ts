import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelPriceList } from 'src/domain/models/application/ports/model-price-list';
import type { ModelPrice } from 'src/domain/models/application/models/model-price';
import { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';

// Mistral bills its regional endpoints, which chat requests use, at 1.1x list.
const MISTRAL_REGIONAL_PRICE_FACTOR = 1.1;
const DECIMAL_FACTOR = 10_000;

type PriceLookup = (identifiers: readonly string[]) => ModelPrice | undefined;

@Injectable()
export class ModelPriceSuggestionService {
  private readonly logger = new Logger(ModelPriceSuggestionService.name);

  constructor(
    private readonly modelPriceList: ModelPriceList,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Estimated EUR prices for Mistral models. Without a configured exchange rate
   * the public price list is not contacted at all. Prices are a convenience, so
   * an unreachable list yields no suggestion instead of an error.
   */
  async createMistralPriceLookup(): Promise<PriceLookup> {
    const usdToEur = this.readExchangeRate();
    if (usdToEur === undefined) return () => undefined;

    let prices: ReadonlyMap<string, ModelPrice>;
    try {
      prices = await this.modelPriceList.findUsdListPrices(
        ModelProvider.MISTRAL,
      );
    } catch (error) {
      this.logger.warn({ err: error as Error }, 'Model price list unavailable');
      return () => undefined;
    }

    const factor = usdToEur * MISTRAL_REGIONAL_PRICE_FACTOR;
    const convert = (usd: number): number =>
      Math.round(usd * factor * DECIMAL_FACTOR) / DECIMAL_FACTOR;

    return (identifiers) => {
      const listPrice = identifiers
        .map((identifier) => prices.get(identifier))
        .find((price) => price !== undefined);
      return (
        listPrice && {
          inputTokenCost: convert(listPrice.inputTokenCost),
          outputTokenCost: convert(listPrice.outputTokenCost),
        }
      );
    };
  }

  private readExchangeRate(): number | undefined {
    const configured = this.configService.get<string>(
      'models.priceSuggestion.usdToEurRate',
    );
    if (!configured) return undefined;
    const rate = Number(configured);
    if (Number.isFinite(rate) && rate > 0) return rate;
    this.logger.warn(
      'MODEL_PRICE_USD_TO_EUR_RATE is not a positive number; no prices are suggested',
    );
    return undefined;
  }
}
