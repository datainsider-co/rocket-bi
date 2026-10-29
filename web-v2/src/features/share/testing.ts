import { vi } from 'vitest';
import { PermissionToken, ResourceSharing } from '@/core/share/ResourceSharing';
import type { DatabaseShareService } from '@/core/schema/DatabaseShareService';
import type { ShareService } from '@/core/share/ShareService';

type Service = ShareService;

/** Test-only: a resource owned by root, shared with nobody, without a link, whose changes all succeed. */
export function fakeShareService(overrides: Partial<Service> = {}): Service {
  return {
    getSharing: vi.fn<Service['getSharing']>(
      async () => new ResourceSharing({ owner: { username: 'root', full_name: 'root', email: 'hello@gmail.com' }, users_sharing: [] })
    ),
    shareWithUsers: vi.fn<Service['shareWithUsers']>(async () => {}),
    editShares: vi.fn<Service['editShares']>(async () => {}),
    revokeShares: vi.fn<Service['revokeShares']>(async () => {}),
    getLink: vi.fn<Service['getLink']>(async () => null),
    createLink: vi.fn<Service['createLink']>(
      async ({ type, id }, actions) => new PermissionToken({ token_id: 'tok-1', creator: 'root', permissions: actions.map(action => `0:${type}:${action}:${id}`) })
    ),
    updateLink: vi.fn<Service['updateLink']>(async () => {}),
    revokeLink: vi.fn<Service['revokeLink']>(async () => {}),
    ...overrides
  };
}

/** Test-only: a database owned by root, shared with nobody, whose changes all succeed. */
export function fakeDatabaseShareService(overrides: Partial<DatabaseShareService> = {}): DatabaseShareService {
  return {
    getSharing: vi.fn<DatabaseShareService['getSharing']>(
      async () => new ResourceSharing({ owner: { username: 'root', full_name: 'root', email: 'hello@gmail.com' }, users_sharing: [] })
    ),
    shareWithUsers: vi.fn<DatabaseShareService['shareWithUsers']>(async () => {}),
    editShares: vi.fn<DatabaseShareService['editShares']>(async () => {}),
    revokeShares: vi.fn<DatabaseShareService['revokeShares']>(async () => {}),
    ...overrides
  };
}
