import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { ApiError, ApiErrorReason } from '@/shared/http/ApiError';
import { LoginResponse } from './LoginResponse';

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  verifyCode: string;
}

export interface AuthenticationService {
  login(email: string, password: string): Promise<LoginResponse>;
  /** Resolves the current session to its user. Fails with `not_authenticated` when the session is gone. */
  checkSession(): Promise<LoginResponse>;
  /** Ends the session on the server. */
  logout(): Promise<void>;
  /** Sends a verification code to the email. */
  forgotPassword(email: string): Promise<void>;
  /** Checks a code without consuming it. Fails with `verification_code_invalid` when it is wrong. */
  verifyCode(email: string, code: string): Promise<void>;
  resetPassword(request: ResetPasswordRequest): Promise<void>;
}

/** DI token; the interface and its token share the name, like v1's abstract class keys. */
export const AuthenticationService = token<AuthenticationService>('AuthenticationService');

const API_PATH = 'user/auth';

/**
 * Request bodies spell out the server's snake_case names (backend case classes, Jackson SNAKE_CASE). v1 sent extra
 * fields (`remember`, `confirm_password`) that the server ignores; they are dropped here.
 */
export class HttpAuthenticationService implements AuthenticationService {
  constructor(private readonly http: KyInstance) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const json = await this.http.post(`${API_PATH}/login`, { json: { email, password } }).json();
    return new LoginResponse(json);
  }

  async checkSession(): Promise<LoginResponse> {
    const json = await this.http.get(`${API_PATH}/check_session`).json();
    return new LoginResponse(json);
  }

  async logout(): Promise<void> {
    await this.http.post(`${API_PATH}/logout`);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.http.post(`${API_PATH}/forgot_password`, { json: { email } });
  }

  async verifyCode(email: string, code: string): Promise<void> {
    // Answers 200 with `{ success: false, message }` for a wrong code instead of an HTTP error.
    const json = await this.http.post(`${API_PATH}/${encodeURIComponent(code)}/status`, { json: { email } }).json();
    const result = typeof json === 'object' && json !== null ? (json as { success?: unknown; message?: unknown }) : {};
    if (result.success !== true) {
      const message = typeof result.message === 'string' && result.message ? result.message : 'The code is invalid';
      throw new ApiError(message, 400, ApiErrorReason.verificationCodeInvalid);
    }
  }

  async resetPassword({ email, newPassword, verifyCode }: ResetPasswordRequest): Promise<void> {
    await this.http.post(`${API_PATH}/reset_password`, {
      json: { email, new_password: newPassword, verify_code: verifyCode }
    });
  }
}
