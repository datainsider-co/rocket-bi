import { describe, expect, it } from 'vitest';
import { ApiError, ApiErrorReason } from '@/shared/http/ApiError';
import {
  emailSchema,
  loginSchema,
  resetPasswordSchema,
  toAuthErrorMessage,
  toLoginErrorMessage
} from './auth.utils';

describe('toAuthErrorMessage', () => {
  it('maps a known reason', () => {
    expect(toAuthErrorMessage(new ApiError('Email Not Exists', 400, 'email_not_existed'))).toBe(
      'This email not existed. Please try again.'
    );
  });

  it('keeps the server message for an unknown reason', () => {
    expect(toAuthErrorMessage(new ApiError('Quota exceeded', 400, 'quota_exceed'))).toBe('Quota exceeded');
  });

  it.each([ApiErrorReason.timeout, ApiErrorReason.network])('keeps the message of a %s error', reason => {
    expect(toAuthErrorMessage(new ApiError('Cannot connect', 0, reason))).toBe('Cannot connect');
  });

  it('uses a generic message for a non-API error', () => {
    expect(toAuthErrorMessage(new Error('boom'))).toMatch(/internal error/i);
    expect(toAuthErrorMessage(undefined)).toMatch(/internal error/i);
  });
});

describe('toLoginErrorMessage', () => {
  it('reads a wrong password (500 internal_error) as wrong credentials', () => {
    expect(toLoginErrorMessage(new ApiError('Submitted credentials ... did not match', 500, 'internal_error'))).toBe(
      'Incorrect email or password'
    );
  });

  it('maps a 400 by its reason', () => {
    expect(toLoginErrorMessage(new ApiError('not found: email', 400, 'invalid_credentials'))).toBe(
      'Incorrect email or password'
    );
    expect(toLoginErrorMessage(new ApiError('x', 400, 'expired'))).toMatch(/License expired/);
  });

  it('reports connection problems as they are', () => {
    expect(toLoginErrorMessage(new ApiError('Request timed out', 0, ApiErrorReason.timeout))).toBe('Request timed out');
  });

  it('falls back to wrong credentials for anything else', () => {
    expect(toLoginErrorMessage(new Error('boom'))).toBe('Incorrect email or password');
  });
});

/** First message per field, which is what react-hook-form shows. */
function errorsOf(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) errors[issue.path.join('.')] ??= issue.message;
  return errors;
}

describe('loginSchema', () => {
  it('accepts an email and a password, trimming the email', () => {
    expect(loginSchema.parse({ email: ' a@b.co ', password: 'x' })).toEqual({ email: 'a@b.co', password: 'x' });
  });

  it('requires both fields', () => {
    expect(errorsOf(loginSchema.safeParse({ email: '', password: '' }))).toEqual({
      email: 'Email is required!',
      password: 'Password is required!'
    });
  });

  it('rejects a malformed email', () => {
    expect(errorsOf(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }))).toEqual({
      email: 'Invalid email format'
    });
  });
});

describe('emailSchema', () => {
  it('validates the email the same way', () => {
    expect(emailSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
    expect(errorsOf(emailSchema.safeParse({ email: '  ' }))).toEqual({ email: 'Email is required!' });
  });
});

describe('resetPasswordSchema', () => {
  it('accepts a long enough password that matches its confirmation', () => {
    expect(resetPasswordSchema.safeParse({ password: '123456', confirmPassword: '123456' }).success).toBe(true);
  });

  it('requires both fields', () => {
    expect(errorsOf(resetPasswordSchema.safeParse({ password: '', confirmPassword: '' }))).toMatchObject({
      password: 'Password is required!',
      confirmPassword: 'Confirm Password is required!'
    });
  });

  it('needs at least 6 characters', () => {
    expect(errorsOf(resetPasswordSchema.safeParse({ password: '12345', confirmPassword: '12345' }))).toEqual({
      password: 'Password must be at least 6 characters!'
    });
  });

  it('reports a mismatch on the confirmation field', () => {
    expect(errorsOf(resetPasswordSchema.safeParse({ password: '123456', confirmPassword: '654321' }))).toEqual({
      confirmPassword: 'Confirm Password not correct!'
    });
  });
});
