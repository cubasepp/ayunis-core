import { Mistral } from '@mistralai/mistralai';
import type { RetryConfig } from '@mistralai/mistralai/lib/retries';

export interface MistralClientOptions {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
}

/** Chat and model listing must address the same regional endpoint. */
export const createMistralClient = (options: MistralClientOptions): Mistral =>
  new Mistral({
    apiKey: options.apiKey,
    server: 'eu',
    ...(options.baseUrl ? { serverURL: options.baseUrl } : {}),
    retryConfig: toRetryConfig(options.maxRetries ?? 0),
  });

/**
 * Mistral expresses retries as a time-budgeted exponential backoff rather than
 * a fixed attempt count, so the runtime's `maxRetries` is translated into an
 * elapsed-time budget that allows roughly that many transient-failure retries.
 */
const toRetryConfig = (maxRetries: number): RetryConfig => {
  if (maxRetries <= 0) {
    return { strategy: 'none' };
  }
  return {
    strategy: 'backoff',
    backoff: {
      initialInterval: 1000,
      maxInterval: 10000,
      exponent: 2,
      maxElapsedTime: maxRetries * 20000,
    },
    retryConnectionErrors: true,
  };
};
