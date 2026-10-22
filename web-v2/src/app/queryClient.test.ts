import { describe, expect, it } from 'vitest';
import { ApiError, ApiErrorReason } from '@/shared/http/ApiError';
import { shouldRetryQuery } from './queryClient';

describe('shouldRetryQuery', () => {
  it.each([400, 401, 403, 404])('does not retry a %i', status => {
    expect(shouldRetryQuery(0, new ApiError('x', status, 'r'))).toBe(false);
  });

  it('retries a 5xx once', () => {
    const error = new ApiError('x', 500, 'internal_error');

    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(false);
  });

  it('retries timeouts, network failures and unknown errors', () => {
    expect(shouldRetryQuery(0, new ApiError('x', 0, ApiErrorReason.timeout))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError('x', 0, ApiErrorReason.network))).toBe(true);
    expect(shouldRetryQuery(0, new Error('x'))).toBe(true);
  });
});
