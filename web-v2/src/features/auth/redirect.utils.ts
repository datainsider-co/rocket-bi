/**
 * Login redirect helpers. Kept apart from `auth.utils.ts` (which pulls in zod) because route guards and the
 * session-expired handler load with the main bundle.
 */
export const DEFAULT_REDIRECT = '/';

/** Only same-origin paths, so `?redirect=` cannot send the user to another site. */
export function toSafeRedirect(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return DEFAULT_REDIRECT;
  }
  return raw;
}

export interface LoginSearch {
  redirect?: string;
}

export function parseLoginSearch(search: Record<string, unknown>): LoginSearch {
  return typeof search.redirect === 'string' && search.redirect ? { redirect: search.redirect } : {};
}

export function toLoginHref(currentPath: string): string {
  return currentPath === '/' ? '/login' : `/login?redirect=${encodeURIComponent(currentPath)}`;
}
