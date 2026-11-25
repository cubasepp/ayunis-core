import type { ConfigService } from '@nestjs/config';
import { GetMistralModelSuggestionsUseCase } from './get-mistral-model-suggestions.use-case';
import { ModelPriceSuggestionService } from 'src/domain/models/application/services/model-price-suggestion.service';
import type { MistralModelCatalog } from 'src/domain/models/application/ports/mistral-model-catalog';
import type { ModelPriceList } from 'src/domain/models/application/ports/model-price-list';
import type { ModelsRepository } from 'src/domain/models/application/ports/models.repository';
import type { ProviderModelListing } from 'src/domain/models/application/models/provider-model-listing';
import {
  ProviderModelListFailedError,
  ProviderModelListNotConfiguredError,
} from 'src/domain/models/application/model-suggestion.errors';
import { LanguageModel } from 'src/domain/models/domain/models/language.model';
import { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';

// Trimmed from a response of Mistral's EU `GET /v1/models`.
const listing = (
  id: string,
  name: string,
  billingName: string,
  aliases: string[],
): ProviderModelListing => ({
  id,
  name,
  billingName,
  aliases,
  supportsChat: true,
  supportsTools: true,
  supportsVision: false,
  supportsReasoning: true,
  contextWindowSize: 1_048_576,
});

const GLM_5_3 = 'zai-glm-5-3';
const MISTRAL_LISTINGS = [
  listing('zai-glm-5-2', 'glm-5-2', 'zai-glm-5-2', ['glm-5-2']),
  listing(GLM_5_3, GLM_5_3, GLM_5_3, [
    'zai-glm-5',
    'zai-glm-latest',
    'glm-5-latest',
  ]),
  listing('zai-glm-5', GLM_5_3, GLM_5_3, [
    GLM_5_3,
    'zai-glm-latest',
    'glm-5-latest',
  ]),
  listing('zai-glm-latest', GLM_5_3, GLM_5_3, [
    GLM_5_3,
    'zai-glm-5',
    'glm-5-latest',
  ]),
  {
    ...listing('mistral-embed', 'mistral-embed', 'mistral-embed', []),
    supportsChat: false,
  },
];

describe('GetMistralModelSuggestionsUseCase', () => {
  const setup = ({
    config = {},
    catalogNames = [] as string[],
    priceList = jest
      .fn()
      .mockResolvedValue(
        new Map([[GLM_5_3, { inputTokenCost: 1.4, outputTokenCost: 4.4 }]]),
      ),
  } = {}) => {
    const values: Record<string, string | undefined> = {
      'models.mistral.apiKey': 'mistral-key',
      'models.priceSuggestion.usdToEurRate': '0.9',
      ...config,
    };
    const configService = {
      get: (key: string) => values[key],
    } as ConfigService;
    const catalog: MistralModelCatalog = {
      list: jest.fn().mockResolvedValue(MISTRAL_LISTINGS),
    };
    const repository = {
      findAll: jest.fn().mockResolvedValue(
        catalogNames.map(
          (name) =>
            new LanguageModel({
              name,
              displayName: name,
              provider: ModelProvider.MISTRAL,
              canStream: true,
              canUseTools: true,
              isReasoning: true,
              canVision: false,
              contextWindowSize: 128_000,
              isArchived: false,
            }),
        ),
      ),
    } as unknown as ModelsRepository;
    const prices: ModelPriceList = { findUsdListPrices: priceList };
    return {
      catalog,
      priceList,
      useCase: new GetMistralModelSuggestionsUseCase(
        catalog,
        repository,
        new ModelPriceSuggestionService(prices, configService),
        configService,
      ),
    };
  };

  it('suggests each chat model once, under a fixed version instead of a moving alias', async () => {
    const suggestions = await setup().useCase.execute();

    expect(suggestions.map((s) => [s.name, s.displayName])).toEqual([
      ['zai-glm-5-2', 'GLM 5.2'],
      [GLM_5_3, 'GLM 5.3'],
    ]);
  });

  it('marks a model as in the catalog when it was added under an alias', async () => {
    const { useCase } = setup({ catalogNames: ['zai-glm-latest'] });

    const suggestions = await useCase.execute();

    expect(suggestions.map((s) => s.isInCatalog)).toEqual([false, true]);
  });

  it('converts the USD list price to EUR including the regional surcharge', async () => {
    const [unpriced, priced] = await setup().useCase.execute();

    expect(priced.price).toEqual({
      inputTokenCost: 1.386,
      outputTokenCost: 4.356,
    });
    expect(unpriced.price).toBeUndefined();
  });

  it.each([undefined, '0', 'not-a-rate'])(
    'does not contact the price list when the exchange rate is %s',
    async (rate) => {
      const { useCase, priceList } = setup({
        config: { 'models.priceSuggestion.usdToEurRate': rate },
      });

      const suggestions = await useCase.execute();

      expect(suggestions.every((s) => s.price === undefined)).toBe(true);
      expect(priceList).not.toHaveBeenCalled();
    },
  );

  it('still suggests models when the price list is unreachable', async () => {
    const { useCase } = setup({
      priceList: jest.fn().mockRejectedValue(new Error('offline')),
    });

    const suggestions = await useCase.execute();

    expect(suggestions).toHaveLength(2);
    expect(suggestions.every((s) => s.price === undefined)).toBe(true);
  });

  it('reports a failed model list without a status the app reads as a restart', async () => {
    const { useCase, catalog } = setup();
    jest.mocked(catalog.list).mockRejectedValue(new Error('503 from Mistral'));

    const error = await useCase.execute().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProviderModelListFailedError);
    const response = (error as ProviderModelListFailedError).toHttpException();
    expect(response.getStatus()).toBe(424);
    expect(response.getResponse()).toMatchObject({
      metadata: { provider: 'mistral' },
    });
  });

  it('reports a missing API key as a configuration problem', async () => {
    const { useCase } = setup({
      config: { 'models.mistral.apiKey': undefined },
    });

    await expect(useCase.execute()).rejects.toThrow(
      ProviderModelListNotConfiguredError,
    );
  });
});
