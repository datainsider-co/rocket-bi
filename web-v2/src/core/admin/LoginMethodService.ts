import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asRecord } from '@/core/json/json';
import {
  DEFAULT_GOOGLE_LOGIN_METHOD,
  GOOGLE_OAUTH_TYPE,
  googleLoginMethodFromJson,
  googleLoginMethodToJson,
  type GoogleLoginMethod
} from './LoginMethod';

/** The organization's Google login (v1 `LoginSettingsModal`). Saving needs `login_method:manage`. */
export interface LoginMethodService {
  /** The stored entry, or the default one when there is none. */
  getGoogle(): Promise<GoogleLoginMethod>;
  saveGoogle(method: GoogleLoginMethod): Promise<GoogleLoginMethod>;
}

export const LoginMethodService = token<LoginMethodService>('LoginMethodService');

export class HttpLoginMethodService implements LoginMethodService {
  constructor(private readonly http: KyInstance) {}

  async getGoogle(): Promise<GoogleLoginMethod> {
    const entry = asRecord(await this.http.get('user/auth/login_methods').json())[GOOGLE_OAUTH_TYPE];
    return entry === undefined ? DEFAULT_GOOGLE_LOGIN_METHOD : googleLoginMethodFromJson(entry);
  }

  async saveGoogle(method: GoogleLoginMethod): Promise<GoogleLoginMethod> {
    const json = { [GOOGLE_OAUTH_TYPE]: googleLoginMethodToJson(method) };
    const saved = asRecord(await this.http.put('admin/setting/login_methods', { json }).json())[GOOGLE_OAUTH_TYPE];
    return saved === undefined ? method : googleLoginMethodFromJson(saved);
  }
}
