import type { KyInstance } from 'ky';
import { token, type DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { asArray, asNumber, asRecord, isRecord, type JsonObject } from '@/core/json/json';
import { UserProfile } from './UserProfile';

/**
 * A user found by name or email. `json` is the profile exactly as the server sent it: View As sends it back, and its
 * `properties` (what row level security reads) are data whose keys must stay as they are.
 */
export interface SuggestedUser {
  profile: UserProfile;
  json: JsonObject;
}

export interface UserSuggestions {
  total: number;
  users: SuggestedUser[];
}

export interface UserService {
  /** Users of the organization matching `keyword` (v1 `UserAdminService.getSuggestedUsers`). */
  suggest(keyword: string, from: number, size: number, signal?: AbortSignal): Promise<UserSuggestions>;
}

export const UserService = token<UserService>('UserService');

export class HttpUserService implements UserService {
  constructor(private readonly http: KyInstance) {}

  async suggest(keyword: string, from: number, size: number, signal?: AbortSignal): Promise<UserSuggestions> {
    const page = asRecord(await this.http.post('user/profile/suggest', { json: { keyword, from, size }, signal }).json());
    const users = asArray(page['data'])
      .filter(isRecord)
      .map(json => ({ profile: new UserProfile(json), json }));
    return { total: asNumber(page['total']), users };
  }
}

export const UserModule: DiModule = di => {
  di.bindSingleton(UserService, d => new HttpUserService(d.get(ApiClient)));
};
