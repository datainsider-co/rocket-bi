import type { EtlShareService } from '@/core/data-cook/EtlShareService';
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

/** The people endpoints of one resource. */
interface ResourcePeopleApi {
  getSharing(): Promise<ResourceSharing>;
  shareWithUsers(actionsByUsername: ActionsByKey): Promise<void>;
  editShares(actionsByShareId: ActionsByKey): Promise<void>;
  revokeShares(usernames: readonly string[]): Promise<void>;
}

/** A service with its own share endpoints, keyed by the resource's id (databases by name, ETLs by id). */
interface OwnShareService<Id> {
  getSharing(id: Id): Promise<ResourceSharing>;
  shareWithUsers(id: Id, actionsByUsername: ActionsByKey): Promise<void>;
  editShares(id: Id, actionsByShareId: ActionsByKey): Promise<void>;
  revokeShares(id: Id, usernames: readonly string[]): Promise<void>;
}

function ownEndpoints<Id>(service: OwnShareService<Id>, id: Id): ResourcePeopleApi {
  return {
    getSharing: () => service.getSharing(id),
    shareWithUsers: actions => service.shareWithUsers(id, actions),
    editShares: actions => service.editShares(id, actions),
    revokeShares: usernames => service.revokeShares(id, usernames)
  };
}

/**
 * Directories go through `share/directory/{id}`; databases and ETLs through their own `databases/{name}/share/*` and
 * `data_cook/{id}/share/*`.
 */
export function sharePeopleApi(share: ShareService, databases: DatabaseShareService, etls: EtlShareService): SharePeopleApi {
  const of = (resource: PeopleResource): ResourcePeopleApi => {
    switch (resource.type) {
      case 'database':
        return ownEndpoints(databases, resource.id);
      case 'etl':
        return ownEndpoints(etls, resource.id);
      case 'directory':
        return {
          getSharing: () => share.getSharing(resource, 0, SHARING_PAGE_SIZE),
          shareWithUsers: actions => share.shareWithUsers(resource, actions),
          editShares: actions => share.editShares(resource, actions),
          revokeShares: usernames => share.revokeShares(resource, usernames)
        };
    }
  };
  return {
    getSharing: resource => of(resource).getSharing(),
    shareWithUsers: (resource, actions) => of(resource).shareWithUsers(actions),
    editShares: (resource, actions) => of(resource).editShares(actions),
    revokeShares: (resource, usernames) => of(resource).revokeShares(usernames)
  };
}
