import { describe, expect, it } from 'vitest';
import { ApiError, ApiErrorReason, isApiError, parseApiErrorBody } from './ApiError';

describe('parseApiErrorBody', () => {
  it('reads the flat format', () => {
    const error = parseApiErrorBody(
      { code: 401, reason: 'not_authenticated', message: 'the session is expired or invalid.' },
      401
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      reason: 'not_authenticated',
      message: 'the session is expired or invalid.'
    });
  });

  it('reads the wrapped format', () => {
    const error = parseApiErrorBody(
      { success: false, error: { code: 500, reason: 'internal_error', message: 'Internal Server Error' } },
      502
    );

    expect(error).toMatchObject({ status: 500, reason: 'internal_error', message: 'Internal Server Error' });
  });

  it('accepts msg as the message field', () => {
    expect(parseApiErrorBody({ code: 400, msg: 'bad' }, 400).message).toBe('bad');
  });

  it.each([undefined, '<html>Bad Gateway</html>', null, 42])('falls back to the HTTP status for %j', body => {
    const error = parseApiErrorBody(body, 502);

    expect(error.status).toBe(502);
    expect(error.reason).toBe(ApiErrorReason.unknown);
    expect(error.message).not.toBe('');
  });

  it('ignores fields with the wrong type', () => {
    const error = parseApiErrorBody({ code: '500', reason: 1, message: {} }, 503);

    expect(error).toMatchObject({ status: 503, reason: ApiErrorReason.unknown });
  });

  it('keeps the cause', () => {
    const cause = new Error('original');

    expect(parseApiErrorBody({}, 500, { cause }).cause).toBe(cause);
  });
});

describe('isApiError', () => {
  it('matches only ApiError', () => {
    expect(isApiError(new ApiError('x', 400, 'r'))).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError({ status: 400, reason: 'r', message: 'x' })).toBe(false);
  });
});
