import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';
import { toErrorMessage } from './errorMessage';

describe('toErrorMessage', () => {
  it("shows the server's message", () => {
    expect(toErrorMessage(new ApiError('Communications link failure', 500, 'db_execute_error'))).toBe('Communications link failure');
  });

  it.each([[new Error('')], ['boom'], [undefined]])('falls back for %j', error => {
    expect(toErrorMessage(error)).toMatch(/^Oops internal error!/);
  });
});
