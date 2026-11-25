import type { ModelSuggestionResponseDto } from '@ayunis/api-client';
import type { LanguageModelFormData } from '@/pages/super-admin-settings/models-catalog/model/types';

/**
 * Tier and description are the super admin's own choices and stay. Prices are
 * always replaced, so one model's price cannot carry over to another.
 */
export function applyModelSuggestion(
  current: LanguageModelFormData,
  suggestion: ModelSuggestionResponseDto,
): LanguageModelFormData {
  return {
    ...current,
    name: suggestion.name,
    displayName: suggestion.displayName,
    contextWindowSize: suggestion.contextWindowSize,
    canStream: true,
    canUseTools: suggestion.canUseTools,
    canVision: suggestion.canVision,
    isReasoning: suggestion.isReasoning,
    inputTokenCost: suggestion.inputTokenCost,
    outputTokenCost: suggestion.outputTokenCost,
  };
}
