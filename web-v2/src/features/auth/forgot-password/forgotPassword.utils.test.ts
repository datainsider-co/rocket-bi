import { describe, expect, it } from 'vitest';
import {
  forgotPasswordReducer,
  initialForgotPasswordState,
  isCompleteCode,
  secondsUntilResend
} from './forgotPassword.utils';
import type { ForgotPasswordState } from './forgotPassword.utils';

const emailStep: ForgotPasswordState = { step: 'email', email: '' };
const codeStep: ForgotPasswordState = { step: 'code', email: 'a@b.c' };
const resetStep: ForgotPasswordState = { step: 'reset', email: 'a@b.c', code: '123456' };

describe('initialForgotPasswordState', () => {
  it('starts at the email step', () => {
    expect(initialForgotPasswordState()).toEqual(emailStep);
    expect(initialForgotPasswordState('a@b.c')).toEqual({ step: 'email', email: 'a@b.c' });
  });
});

describe('forgotPasswordReducer', () => {
  it('moves to the code step once the code is sent', () => {
    expect(forgotPasswordReducer(emailStep, { type: 'codeSent', email: 'a@b.c' })).toEqual(codeStep);
  });

  it('moves to the reset step once the code is verified', () => {
    expect(forgotPasswordReducer(codeStep, { type: 'codeVerified', code: '123456' })).toEqual(resetStep);
  });

  it('goes back to the email step, keeping the email', () => {
    expect(forgotPasswordReducer(codeStep, { type: 'editEmail' })).toEqual({ step: 'email', email: 'a@b.c' });
  });

  it.each([
    [codeStep, { type: 'codeSent', email: 'x@y.z' }],
    [resetStep, { type: 'codeSent', email: 'x@y.z' }],
    [emailStep, { type: 'codeVerified', code: '1' }],
    [resetStep, { type: 'codeVerified', code: '1' }],
    [emailStep, { type: 'editEmail' }],
    [resetStep, { type: 'editEmail' }]
  ] as const)('ignores an action that does not fit the step (%j, %j)', (state, action) => {
    expect(forgotPasswordReducer(state, action)).toBe(state);
  });
});

describe('isCompleteCode', () => {
  it.each([
    ['123456', true],
    ['12345', false],
    ['1234567', false],
    ['12a456', false],
    ['', false]
  ])('%j is %s', (code, expected) => {
    expect(isCompleteCode(code)).toBe(expected);
  });
});

describe('secondsUntilResend', () => {
  it('counts down from the wait time', () => {
    expect(secondsUntilResend(1_000, 1_000, 10)).toBe(10);
    expect(secondsUntilResend(1_000, 1_500, 10)).toBe(10);
    expect(secondsUntilResend(1_000, 2_000, 10)).toBe(9);
  });

  it('reaches zero and never goes negative', () => {
    expect(secondsUntilResend(1_000, 11_000, 10)).toBe(0);
    expect(secondsUntilResend(1_000, 99_000, 10)).toBe(0);
  });
});
