import { z } from 'zod';
import { ApiErrorReason, isApiError } from '@/shared/http/ApiError';

export const PASSWORD_MIN_LENGTH = 6;

const INCORRECT_CREDENTIALS = 'Incorrect email or password';
const INTERNAL_ERROR = 'Oops internal error! Try to refresh page or feel free contact us if issue persists.';

/** Ported from v1 `AuthenticationStore.setError`. */
const MESSAGE_BY_REASON: Readonly<Record<string, string>> = {
  invalid_credentials: INCORRECT_CREDENTIALS,
  email_existed: 'This email existed. Please try again.',
  already_existed: 'This email existed. Please try again.',
  email_invalid: 'Your email invalid',
  email_not_existed: 'This email not existed. Please try again.',
  email_required: 'Email required',
  email_verification_required: 'You need to verify your registered email',
  registration_required: 'You need to register account first.',
  verification_code_invalid: 'The code is invalid. Please check it again.',
  expired: 'License expired. Please contact us to renew your license.',
  internal_error: INTERNAL_ERROR
};

function isConnectionProblem(reason: string): boolean {
  return reason === ApiErrorReason.timeout || reason === ApiErrorReason.network;
}

export function toAuthErrorMessage(error: unknown): string {
  if (!isApiError(error)) return INTERNAL_ERROR;
  if (isConnectionProblem(error.reason)) return error.message;
  return MESSAGE_BY_REASON[error.reason] ?? error.message;
}

/**
 * The server answers a wrong password with 500 `internal_error`, so like v1 only a 400 keeps its own message; any
 * other API failure reads as wrong credentials.
 */
export function toLoginErrorMessage(error: unknown): string {
  if (isApiError(error) && (error.status === 400 || isConnectionProblem(error.reason))) {
    return toAuthErrorMessage(error);
  }
  return INCORRECT_CREDENTIALS;
}

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required!')
  .pipe(z.email('Invalid email format'));

const newPasswordField = z
  .string()
  .min(1, 'Password is required!')
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters!`);

/** Messages are v1's (vuelidate rules in `LoginPanel`, `ForgotPasswordPanel`, `ResetPasswordPanel`). */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required!')
});

export const emailSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirm Password is required!')
  })
  .refine(values => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Confirm Password not correct!'
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type EmailValues = z.infer<typeof emailSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
