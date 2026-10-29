import type { ResourceAction } from '@/core/permission/ResourcePermissionService';
import type { DatabaseShareService } from '@/core/schema/DatabaseShareService';
import type { ResourceSharing } from '@/core/share/ResourceSharing';
import type { ShareService } from '@/core/share/ShareService';
import type { PeopleResource } from '../share.utils';

/** v1 read the first 100 users a resource is shared with. */
const SHARING_PAGE_SIZE = 100;

type ActionsByKey = Readonly<Record<string, readonly ResourceAction[]>>;

/** The people endpoints of a resource: who it is shared with, and the three ways to change that. */
export interface SharePeopleApi {
  getSharing(resource: PeopleResource): Promise<ResourceSharing>;
  shareWithUsers(resource: PeopleResource, actionsByUsername: ActionsByKey): Promise<void>;
  editShares(resource: PeopleResource, actionsByShareId: ActionsByKey): Promise<void>;
  revokeShares(resource: PeopleResource, usernames: readonly string[]): Promise<void>;
}

/** Directories go through `share/directory/{id}`, databases through their own `databases/{name}/share/*`. */
export function sharePeopleApi(share: ShareService, databases: DatabaseShareService): SharePeopleApi {
  return {
    getSharing: resource =>
      resource.type === 'database' ? databases.getSharing(resource.id) : share.getSharing(resource, 0, SHARING_PAGE_SIZE),
    shareWithUsers: (resource, actions) =>
      resource.type === 'database' ? databases.shareWithUsers(resource.id, actions) : share.shareWithUsers(resource, actions),
    editShares: (resource, actions) =>
      resource.type === 'database' ? databases.editShares(resource.id, actions) : share.editShares(resource, actions),
    revokeShares: (resource, usernames) =>
      resource.type === 'database' ? databases.revokeShares(resource.id, usernames) : share.revokeShares(resource, usernames)
  };
}
