import { ApplicationError } from 'src/common/errors/base.error';
import type { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';

export enum ModelSuggestionErrorCode {
  PROVIDER_MODEL_LIST_NOT_CONFIGURED = 'PROVIDER_MODEL_LIST_NOT_CONFIGURED',
  PROVIDER_MODEL_LIST_FAILED = 'PROVIDER_MODEL_LIST_FAILED',
}

export class ProviderModelListNotConfiguredError extends ApplicationError {
  constructor(provider: ModelProvider) {
    super(
      `Model provider '${provider}' is not configured`,
      ModelSuggestionErrorCode.PROVIDER_MODEL_LIST_NOT_CONFIGURED,
      422,
      { provider },
    );
  }
}

export class ProviderModelListFailedError extends ApplicationError {
  constructor(provider: ModelProvider) {
    // Not 502-504: the app reads those on a GET as a deploy restart, retries
    // for 30 seconds and tells the user Ayunis is unavailable.
    super(
      `Model provider '${provider}' could not list its models`,
      ModelSuggestionErrorCode.PROVIDER_MODEL_LIST_FAILED,
      424,
      { provider },
    );
  }
}
