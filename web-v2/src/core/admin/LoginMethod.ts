import { asArray, asBoolean, asNumber, asRecord, asString, type JsonObject } from '@/core/json/json';

/** `oauth_type` of Google login, the only method v1 let admins set up. */
export const GOOGLE_OAUTH_TYPE = 'gg';

/**
 * One entry of `user/auth/login_methods` (backend `OAuthConfig`). `json` keeps the entry as the server sent it, so
 * fields v2 doesn't edit go back unchanged; `valid` is computed by the server and never sent.
 */
export interface GoogleLoginMethod {
  readonly name: string;
  readonly clientId: string;
  /** Domains whose emails may sign in. */
  readonly whitelistEmail: readonly string[];
  readonly isActive: boolean;
  readonly organizationId: number;
  readonly json: JsonObject;
}

export function googleLoginMethodFromJson(value: unknown): GoogleLoginMethod {
  const json = asRecord(value);
  return {
    name: asString(json['name'], 'Google'),
    clientId: asString(asArray(json['client_ids'])[0]),
    whitelistEmail: asArray(json['whitelist_email']).filter((item): item is string => typeof item === 'string'),
    isActive: asBoolean(json['is_active']),
    organizationId: asNumber(json['organization_id']),
    json
  };
}

export function googleLoginMethodToJson(method: GoogleLoginMethod): JsonObject {
  const rest = Object.fromEntries(Object.entries(method.json).filter(([key]) => key !== 'valid'));
  return {
    ...rest,
    name: method.name,
    oauth_type: GOOGLE_OAUTH_TYPE,
    client_ids: [method.clientId],
    whitelist_email: [...method.whitelistEmail],
    is_active: method.isActive,
    organization_id: method.organizationId
  };
}

/** What a new organization gets when it has no Google entry yet (v1 `OauthConfig.default`). */
export const DEFAULT_GOOGLE_LOGIN_METHOD: GoogleLoginMethod = {
  name: 'Google',
  clientId: '',
  whitelistEmail: [],
  isActive: false,
  organizationId: 0,
  json: {}
};
