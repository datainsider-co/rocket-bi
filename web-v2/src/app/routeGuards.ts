import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { getSession } from '@/core/session/session';
import { DEFAULT_REDIRECT, toLoginHref } from '@/features/auth/redirect.utils';

function currentPath(request: Request): string {
  const url = new URL(request.url);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Pages behind login. Only checks that a session cookie exists; an expired one is caught by the first request
 * (401 → session-expired handler).
 */
export function requireSession({ request }: LoaderFunctionArgs, hasSession: () => boolean = () => !!getSession()) {
  return hasSession() ? null : redirect(toLoginHref(currentPath(request)));
}

/** Login and password pages: a logged-in user goes home instead. */
export function redirectIfLoggedIn(hasSession: () => boolean = () => !!getSession()) {
  return hasSession() ? redirect(DEFAULT_REDIRECT) : null;
}
