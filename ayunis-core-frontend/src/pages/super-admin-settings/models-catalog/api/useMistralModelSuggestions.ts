import { useSuperAdminModelSuggestionsControllerGetMistralModelSuggestions } from '@ayunis/api-client';
import extractErrorData from '@/shared/api/extract-error-data';

export function useMistralModelSuggestions() {
  const { data, error, isError, isLoading } =
    useSuperAdminModelSuggestionsControllerGetMistralModelSuggestions({
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
