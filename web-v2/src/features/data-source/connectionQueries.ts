import { queryOptions } from '@tanstack/react-query';
import type { ConnectionService } from '@/core/connection/ConnectionService';
import type { PermissionService } from '@/core/permission/PermissionService';

/** Everything under `connection` is invalidated together once the connection changes. */
export const connectionKeys = {
  all: ['connection'] as const,
  exists: ['connection', 'exists'] as const,
  detail: ['connection', 'detail'] as const,
  refreshHistory: ['connection', 'refresh-history'] as const,
  sshPublicKey: ['connection', 'ssh-public-key'] as const
};

export function connectionExistsQueryOptions(service: ConnectionService) {
  return queryOptions({ queryKey: connectionKeys.exists, queryFn: () => service.exists() });
}

export function connectionQueryOptions(service: ConnectionService) {
  return queryOptions({ queryKey: connectionKeys.detail, queryFn: () => service.get() });
}

export function refreshHistoryQueryOptions(service: ConnectionService) {
  return queryOptions({ queryKey: connectionKeys.refreshHistory, queryFn: () => service.getRefreshHistory() });
}

/** The organization's key pair doesn't change once created. */
export function sshPublicKeyQueryOptions(service: ConnectionService) {
  return queryOptions({
    queryKey: connectionKeys.sshPublicKey,
    queryFn: () => service.getSshPublicKey(),
    staleTime: Number.POSITIVE_INFINITY
  });
}

/** Whether `username` has `permission`. Move to a shared place when a second feature checks permissions. */
export function permissionQueryOptions(service: PermissionService, username: string, permission: string) {
  return queryOptions({
    queryKey: ['permission', username, permission] as const,
    queryFn: async () => (await service.isPermitted(username, [permission]))[permission] === true,
    staleTime: Number.POSITIVE_INFINITY
  });
}
