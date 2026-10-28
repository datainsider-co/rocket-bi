import { vi } from 'vitest';
import type { ConnectionService } from '@/core/connection/ConnectionService';
import { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import type { PermissionService } from '@/core/permission/PermissionService';

/** Test-only: a ConnectionService for an organization that already has a working connection. */
export function fakeConnectionService(overrides: Partial<ConnectionService> = {}): ConnectionService {
  return {
    exists: vi.fn<ConnectionService['exists']>(async () => true),
    get: vi.fn<ConnectionService['get']>(async () => undefined),
    getSourceType: vi.fn<ConnectionService['getSourceType']>(async () => 'clickhouse_connection'),
    save: vi.fn<ConnectionService['save']>(async () => {}),
    test: vi.fn<ConnectionService['test']>(async () => {}),
    refreshSchema: vi.fn<ConnectionService['refreshSchema']>(async () => {}),
    getRefreshHistory: vi.fn<ConnectionService['getRefreshHistory']>(
      async () => new RefreshSchemaHistory({ id: 1, status: 'success', is_first_run: false })
    ),
    getSshPublicKey: vi.fn<ConnectionService['getSshPublicKey']>(async () => 'ssh-rsa TEST'),
    ...overrides
  };
}

/** Test-only: grants exactly the permissions listed. */
export function fakePermissionService(granted: readonly string[] = []): PermissionService {
  return {
    isPermitted: vi.fn<PermissionService['isPermitted']>(async (_, permissions) =>
      Object.fromEntries(permissions.map(permission => [permission, granted.includes(permission)]))
    )
  };
}
