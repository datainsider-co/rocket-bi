import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/http/ApiError';

const MAX_RETRIES = 1;

/** A 4xx (bad request, no permission, expired session) fails the same way again; timeouts and 5xx may not. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  return !(isApiError(error) && error.status >= 400 && error.status < 500);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false
      }
    }
  });
}
