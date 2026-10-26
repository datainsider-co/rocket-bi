import { queryOptions } from '@tanstack/react-query';
import type { PermissionService } from '@/core/permission/PermissionService';

/** Whether `username` has `permission`. Permissions only change with the user's role, so they never go stale. */
export function permissionQueryOptions(service: PermissionService, username: string, permission: string) {
  return queryOptions({
    queryKey: ['permission', username, permission] as const,
    queryFn: async () => (await service.isPermitted(username, [permission]))[permission] === true,
    staleTime: Number.POSITIVE_INFINITY
  });
}
