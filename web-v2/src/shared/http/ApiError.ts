export const ApiErrorReason = {
  notAuthenticated: 'not_authenticated',
  timeout: 'timeout',
  network: 'network_error',
  unknown: 'unknown'
} as const;

const DEFAULT_MESSAGE = 'Oops internal error! Try to refresh page or feel free contact us if issue persists.';

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly reason: string;

  constructor(message: string, status: number, reason: string, options?: ErrorOptions) {
    super(message, options);
    this.status = status;
    this.reason = reason;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

type ErrorFields = { code?: unknown; reason?: unknown; message?: unknown; msg?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * The backend sends errors in two shapes:
 * - `{ code, reason, message }`
 * - `{ success: false, error: { code, reason, message } }`
 * Anything else (HTML from a proxy, plain text, empty body) falls back to the HTTP status.
 */
export function parseApiErrorBody(body: unknown, status: number, options?: ErrorOptions): ApiError {
  const fields: ErrorFields | undefined = isRecord(body)
    ? body.success === false && isRecord(body.error)
      ? body.error
      : body
    : undefined;

  const message = fields?.message ?? fields?.msg;
  return new ApiError(
    typeof message === 'string' && message ? message : DEFAULT_MESSAGE,
    typeof fields?.code === 'number' ? fields.code : status,
    typeof fields?.reason === 'string' && fields.reason ? fields.reason : ApiErrorReason.unknown,
    options
  );
}
