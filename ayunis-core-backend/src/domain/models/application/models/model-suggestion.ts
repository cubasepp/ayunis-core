import type { ModelPrice } from './model-price';

export interface ModelSuggestion {
  name: string;
  displayName: string;
  contextWindowSize: number;
  canUseTools: boolean;
  canVision: boolean;
  isReasoning: boolean;
  isInCatalog: boolean;
  /** EUR per million tokens; absent when no price could be determined. */
  price?: ModelPrice;
}
