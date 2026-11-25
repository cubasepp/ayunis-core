import { useSuperAdminModelSuggestionsControllerGetModelSuggestions } from '@ayunis/api-client';
import extractErrorData from '@/shared/api/extract-error-data';

type SuggestionProvider = Parameters<
  typeof useSuperAdminModelSuggestionsControllerGetModelSuggestions
>[0];

export function useModelSuggestions(provider: SuggestionProvider) {
  const { data, error, isError, isLoading } =
    useSuperAdminModelSuggestionsControllerGetModelSuggestions(provider, {
      // "Already in the catalog" changes with every catalog edit.
      query: { refetchOnMount: 'always', retry: false },
    });

  return {
    suggestions: data ?? [],
    isLoading,
    errorCode: isError ? readErrorCode(error) : undefined,
  };
}

function readErrorCode(error: unknown): string {
  try {
    return extractErrorData(error).code;
  } catch {
    return 'UNKNOWN';
  }
}
