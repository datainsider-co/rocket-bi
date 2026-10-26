export const CODE_LENGTH = 6;
export const RESEND_AFTER_SECONDS = 180;

export type ForgotPasswordState =
  | { step: 'email'; email: string }
  | { step: 'code'; email: string }
  | { step: 'reset'; email: string; code: string };

export type ForgotPasswordAction =
  | { type: 'codeSent'; email: string }
  | { type: 'codeVerified'; code: string }
  | { type: 'editEmail' };

export function initialForgotPasswordState(email = ''): ForgotPasswordState {
  return { step: 'email', email };
}

/** Email → code → new password. Actions that don't fit the current step are ignored. */
export function forgotPasswordReducer(state: ForgotPasswordState, action: ForgotPasswordAction): ForgotPasswordState {
  switch (action.type) {
    case 'codeSent':
      return state.step === 'email' ? { step: 'code', email: action.email } : state;
    case 'codeVerified':
      return state.step === 'code' ? { step: 'reset', email: state.email, code: action.code } : state;
    case 'editEmail':
      return state.step === 'code' ? { step: 'email', email: state.email } : state;
  }
}

export function isCompleteCode(code: string): boolean {
  return code.length === CODE_LENGTH && /^\d+$/.test(code);
}

/** Whole seconds left before the code may be resent, never negative. */
export function secondsUntilResend(sentAt: number, now: number, waitSeconds = RESEND_AFTER_SECONDS): number {
  return Math.max(0, Math.ceil((sentAt + waitSeconds * 1000 - now) / 1000));
}
