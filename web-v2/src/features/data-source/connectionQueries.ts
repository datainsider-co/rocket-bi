import { queryOptions } from '@tanstack/react-query';
import type { Connection } from '@/core/connection/Connection';
import type { ConnectionService } from '@/core/connection/ConnectionService';

/** Everything under `connection` is invalidated together once the connection changes. */
export const connectionKeys = {
  all: ['connection'] as const,
  exists: ['connection', 'exists'] as const,
  detail: ['connection', 'detail'] as const,
  sourceType: ['connection', 'source-type'] as const,
  refreshHistory: ['connection', 'refresh-history'] as const,
  sshPublicKey: ['connection', 'ssh-public-key'] as const
};

export function connectionExistsQueryOptions(service: ConnectionService) {
  return queryOptions({ queryKey: connectionKeys.exists, queryFn: () => service.exists() });
}

/**
 * The saved connection; `undefined` for a type v2 can't read. Cached as `null`, since a query can't hold `undefined`
 * (it would fail as an error).
 */
export function connectionQueryOptions(service: ConnectionService) {
  return queryOptions({
    queryKey: connectionKeys.detail,
    queryFn: async () => (await service.get()) ?? null,
    select: (connection): Connection | undefined => connection ?? undefined
  });
}

/**
 * The connection's type, whatever it is: the SQL dialect of formulas. It changes only with the connection; without
 * one (or the right to read it) the caller falls back like v1.
 */
export function sourceTypeQueryOptions(service: ConnectionService) {
  return queryOptions({ queryKey: connectionKeys.sourceType, queryFn: () => service.getSourceType(), staleTime: Number.POSITIVE_INFINITY, retry: false });
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
