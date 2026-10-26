import Deneric from 'deneric2';

/**
 * Session returned on login. v1 read `timeoutInMS`, which the server never sends (it sends `max_age_in_ms`), so that
 * field was always undefined there.
 */
export class SessionInfo extends Deneric {
  key = '';
  value = '';
  domain = '';
  path = '/';
  /** Seconds, as used for the cookie `max-age`. */
  maxAge = 0;
  maxAgeInMs = 0;
  createdAt = 0;
  expiredAt = 0;

  constructor(json?: unknown) {
    super({
      key: ['key', String],
      value: ['value', String],
      domain: ['domain', String],
      path: ['path', String],
      maxAge: ['max_age', Number],
      maxAgeInMs: ['max_age_in_ms', Number],
      createdAt: ['created_at', Number],
      expiredAt: ['expired_at', Number]
    });
    this.fromJson(json);
  }
}
