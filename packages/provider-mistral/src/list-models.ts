import type { ModelListData } from '@mistralai/mistralai/models/components';

import { createMistralClient } from './mistral-client';

const LIST_TIMEOUT_MS = 15_000;

type MistralModelCard = Extract<ModelListData, { type: 'base' | 'fine-tuned' }>;

/**
 * One entry of Mistral's model list. The API returns one entry per identifier,
 * so the same model appears again under each of its aliases.
 */
export interface MistralModelEntry {
  id: string;
  name?: string;
  billingName?: string;
  aliases: string[];
  supportsChat: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsReasoning: boolean;
  contextWindowSize: number;
}

export interface ListMistralModelsOptions {
  apiKey: string;
  baseUrl?: string;
}

export const listMistralModels = async (
  options: ListMistralModelsOptions,
): Promise<MistralModelEntry[]> => {
  const client = createMistralClient(options);
  const response = await client.models.list(undefined, {
    timeoutMs: LIST_TIMEOUT_MS,
  });
  return (response.data ?? []).filter(isModelCard).map(toEntry);
};

const isModelCard = (card: ModelListData): card is MistralModelCard =>
  card.type === 'base' || card.type === 'fine-tuned';

const toEntry = (card: MistralModelCard): MistralModelEntry => ({
  id: card.id,
  name: card.name ?? undefined,
  billingName:
    'billingModelName' in card
      ? (card.billingModelName ?? undefined)
      : undefined,
  aliases: card.aliases ?? [],
  supportsChat: card.capabilities.completionChat,
  supportsTools: card.capabilities.functionCalling,
  supportsVision: card.capabilities.vision,
  supportsReasoning: card.capabilities.reasoning,
  contextWindowSize: card.maxContextLength,
});
