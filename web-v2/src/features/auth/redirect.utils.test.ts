import { describe, expect, it } from 'vitest';
import { DEFAULT_REDIRECT, parseLoginSearch, toLoginHref, toSafeRedirect } from './redirect.utils';

describe('toSafeRedirect', () => {
  it.each(['/', '/dashboard/1?tab=a', '/a#b'])('keeps the same-origin path %s', path => {
    expect(toSafeRedirect(path)).toBe(path);
  });

  it.each([undefined, null, 1, '', 'dashboard', 'https://evil.test', '//evil.test', '/\\evil.test'])(
    'falls back to / for %j',
    raw => {
      expect(toSafeRedirect(raw)).toBe(DEFAULT_REDIRECT);
    }
  );
});

describe('parseLoginSearch', () => {
  it('keeps a string redirect', () => {
    expect(parseLoginSearch({ redirect: '/a' })).toEqual({ redirect: '/a' });
  });

  it.each([{}, { redirect: '' }, { redirect: 1 }, { redirect: ['/a'] }])('drops redirect from %j', search => {
    expect(parseLoginSearch(search)).toEqual({});
  });
});

describe('toLoginHref', () => {
  it('omits redirect for the home page', () => {
    expect(toLoginHref('/')).toBe('/login');
  });

  it('encodes the current path', () => {
    expect(toLoginHref('/dashboard/1?tab=a')).toBe('/login?redirect=%2Fdashboard%2F1%3Ftab%3Da');
  });
});
