/** One identifier in a provider's model list; aliases repeat the same model. */
export interface ProviderModelListing {
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
