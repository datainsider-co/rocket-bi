import type { QueryClient } from '@tanstack/react-query';

/** v1's login page. v2 has none yet; a full page load also drops every piece of in-memory state. */
export const LOGIN_PATH = '/login';

interface SessionExpiredDeps {
  queryClient: QueryClient;
  clearSession: () => void;
  redirect: (path: string) => void;
}

/**
 * Runs once, however many requests fail with `not_authenticated` at the same time (a dashboard fires many queries).
 */
export function createSessionExpiredHandler({ queryClient, clearSession, redirect }: SessionExpiredDeps): () => void {
  let handled = false;
  return () => {
    if (handled) return;
    handled = true;
    clearSession();
    queryClient.clear();
    redirect(LOGIN_PATH);
  };
}
