import ky, { isHTTPError, isNetworkError, isTimeoutError } from 'ky';
import type { KyInstance, Options } from 'ky';
import { ApiError, ApiErrorReason, parseApiErrorBody } from './ApiError';

const DEFAULT_TIMEOUT = 30_000;

export type HttpClientOptions = {
  /** Prepended to every request path, e.g. `/api` or `https://host/api`. */
  prefix: string;
  timeout?: number;
  /** Read on every request; empty values are skipped. */
  getHeaders?: () => Record<string, string | undefined>;
  /** Called when the backend rejects the session, before the error is thrown. */
  onUnauthenticated?: (error: ApiError) => void;
  fetch?: Options['fetch'];
};

/**
 * Converts ky failures into `ApiError`. Other errors, such as an abort from TanStack Query, pass through unchanged.
 */
export function toApiError(error: Error): Error {
  if (isHTTPError(error)) {
    return parseApiErrorBody(error.data, error.response.status, { cause: error });
  }
  if (isTimeoutError(error)) {
    return new ApiError('Request timed out', 0, ApiErrorReason.timeout, { cause: error });
  }
  if (isNetworkError(error)) {
    return new ApiError('Cannot connect to the server', 0, ApiErrorReason.network, { cause: error });
  }
  return error;
}

/**
 * Transport only: auth headers, timeout and error normalization. Response bodies are returned as plain JSON
 * (`unknown`) with keys untouched; mapping to domain models (including snake_case ↔ camelCase) belongs to the caller,
 * via deneric2. An empty body parses to `undefined`.
 *
 * No retries: TanStack Query owns retry policy.
 */
export function createHttpClient({
  prefix,
  timeout = DEFAULT_TIMEOUT,
  getHeaders,
  onUnauthenticated,
  fetch
}: HttpClientOptions): KyInstance {
  return ky.create({
    prefix,
    timeout,
    retry: 0,
    fetch,
    parseJson: text => (text === '' ? undefined : JSON.parse(text)),
    hooks: {
      beforeRequest: [
        ({ request }) => {
          for (const [name, value] of Object.entries(getHeaders?.() ?? {})) {
            if (value) request.headers.set(name, value);
          }
        }
      ],
      beforeError: [
        ({ error }) => {
          const converted = toApiError(error);
          if (converted instanceof ApiError && converted.reason === ApiErrorReason.notAuthenticated) {
            onUnauthenticated?.(converted);
          }
          return converted;
        }
      ]
    }
  });
}
