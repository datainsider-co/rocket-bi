import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SESSION_MAX_AGE,
  clearSession,
  getSession,
  getShareToken,
  readCookie,
  saveSession,
  toCookieMaxAge
} from './session';

describe('readCookie', () => {
  it('finds a cookie among others', () => {
    expect(readCookie('a=1; ssid=abc; b=2', 'ssid')).toBe('abc');
  });

  it('does not match a cookie whose name only ends with the key', () => {
    expect(readCookie('old_ssid=x', 'ssid')).toBeUndefined();
  });

  it('decodes the value', () => {
    expect(readCookie('ssid=a%3Db', 'ssid')).toBe('a=b');
  });

  it('treats an empty value as missing', () => {
    expect(readCookie('ssid=', 'ssid')).toBeUndefined();
    expect(readCookie('', 'ssid')).toBeUndefined();
  });
});

describe('session cookie', () => {
  afterEach(() => clearSession());

  it('saves, reads and clears the session', () => {
    saveSession('session-1', 60);
    expect(getSession()).toBe('session-1');

    clearSession();
    expect(getSession()).toBeUndefined();
  });
});

describe('getShareToken', () => {
  it('reads the token query param', () => {
    expect(getShareToken('?token=t-1&x=2')).toBe('t-1');
  });

  it('returns undefined when absent or empty', () => {
    expect(getShareToken('?x=2')).toBeUndefined();
    expect(getShareToken('?token=')).toBeUndefined();
  });
});

describe('toCookieMaxAge', () => {
  it('keeps a positive max age, rounded down', () => {
    expect(toCookieMaxAge(60)).toBe(60);
    expect(toCookieMaxAge(60.9)).toBe(60);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('falls back to the default for %s', value => {
    expect(toCookieMaxAge(value)).toBe(DEFAULT_SESSION_MAX_AGE);
  });
});
