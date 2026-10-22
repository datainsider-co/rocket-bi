import type { QueryClient } from '@tanstack/react-query';
import { toLoginHref } from '@/features/auth/redirect.utils';

interface SessionExpiredDeps {
  queryClient: QueryClient;
  clearSession: () => void;
  /** Path to come back to after logging in again. */
  currentPath: () => string;
  redirect: (href: string) => void;
}

/**
 * Runs once, however many requests fail with `not_authenticated` at the same time (a dashboard fires many queries).
 * A full page load to login also drops every piece of in-memory state.
 */
export function createSessionExpiredHandler({
  queryClient,
  clearSession,
  currentPath,
  redirect
}: SessionExpiredDeps): () => void {
  let handled = false;
  return () => {
    if (handled) return;
    handled = true;
    clearSession();
    queryClient.clear();
    redirect(toLoginHref(currentPath()));
  };
}
