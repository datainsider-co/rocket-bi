import { describe, expect, it } from 'vitest';
import { DEFAULT_GOOGLE_LOGIN_METHOD } from '@/core/admin/LoginMethod';
import { domainError, loginMethodSchema, normalizeDomain, toGoogleLoginMethod, toLoginMethodForm } from './loginMethod.utils';

describe('normalizeDomain', () => {
  it('trims and lowercases', () => {
    expect(normalizeDomain('  Example.COM ')).toBe('example.com');
  });
});

describe('domainError', () => {
  it('requires a domain', () => {
    expect(domainError('', [])).toBe('Domain is required!');
  });

  it.each(['nodot', 'a b.com', '@x.com'])('refuses %s', domain => {
    expect(domainError(domain, [])).toBe('Invalid domain');
  });

  it('refuses a domain already listed', () => {
    expect(domainError('example.com', ['example.com'])).toBe('Domain already added');
  });

  it('accepts a new domain', () => {
    expect(domainError('rocket.bi', ['example.com'])).toBeUndefined();
  });
});

describe('loginMethodSchema', () => {
  it('requires a client id when Google login is on', () => {
    const result = loginMethodSchema.safeParse({ isActive: true, clientId: ' ', whitelistEmail: [] });
    expect(result.success).toBe(false);
  });

  it('allows no client id while it is off', () => {
    expect(loginMethodSchema.safeParse({ isActive: false, clientId: '', whitelistEmail: [] }).success).toBe(true);
  });
});

describe('toLoginMethodForm and toGoogleLoginMethod', () => {
  it('round trips and keeps fields the form does not show', () => {
    const stored = { ...DEFAULT_GOOGLE_LOGIN_METHOD, name: 'Google SSO', organizationId: 7, json: { extra: 1 } };
    const form = toLoginMethodForm(stored);
    const saved = toGoogleLoginMethod(stored, { ...form, isActive: true, clientId: 'id', whitelistEmail: ['a.com'] });
    expect(saved).toEqual({ ...stored, isActive: true, clientId: 'id', whitelistEmail: ['a.com'] });
  });
});
