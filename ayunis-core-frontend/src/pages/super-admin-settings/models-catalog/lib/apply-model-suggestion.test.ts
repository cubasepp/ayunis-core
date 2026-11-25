import { describe, expect, it } from 'vitest';
import { applyModelSuggestion } from './apply-model-suggestion';
import type { LanguageModelFormData } from '@/pages/super-admin-settings/models-catalog/model/types';

const previousSelection: LanguageModelFormData = {
  name: 'zai-glm-5-3',
  provider: 'mistral',
  displayName: 'GLM 5.3',
  canStream: true,
  canUseTools: true,
  canVision: false,
  contextWindowSize: 1_048_576,
  isReasoning: true,
  isArchived: false,
  hasProviderFault: false,
  tier: 'high',
  description: 'For complex tasks',
  inputTokenCost: 1.386,
  outputTokenCost: 4.356,
};

describe('applyModelSuggestion', () => {
  it('drops the previous model price when the new model has none', () => {
    const values = applyModelSuggestion(previousSelection, {
      name: 'mistral-new-2611',
      displayName: 'Mistral New 2611',
      contextWindowSize: 128_000,
      canUseTools: true,
      canVision: true,
      isReasoning: false,
      isInCatalog: false,
    });

    expect(values.inputTokenCost).toBeUndefined();
    expect(values.outputTokenCost).toBeUndefined();
    expect(values).toMatchObject({
      name: 'mistral-new-2611',
      tier: 'high',
      description: 'For complex tasks',
    });
  });
});
