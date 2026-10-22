import { queryOptions } from '@tanstack/react-query';
import type { AuthenticationService } from '@/core/auth/AuthenticationService';

export const currentUserQueryKey = ['auth', 'current-user'] as const;

/** The logged-in user. Login seeds it; it only changes on login or logout, so it never goes stale on its own. */
export function currentUserQueryOptions(service: AuthenticationService) {
  return queryOptions({
    queryKey: currentUserQueryKey,
    queryFn: () => service.checkSession(),
    staleTime: Number.POSITIVE_INFINITY
  });
}
