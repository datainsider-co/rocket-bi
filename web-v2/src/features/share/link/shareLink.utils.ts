import type { ResourceAction } from '@/core/permission/ResourcePermissionService';
import type { PermissionToken } from '@/core/share/ResourceSharing';
import type { ShareResource } from '@/core/share/ShareService';
import { SHARE_LEVEL_ACTIONS, ShareLevel, shareLevelOf } from '@/core/share/shareLevel';

export type LinkChange = { kind: 'keep' } | { kind: 'revoke' } | { kind: 'update'; actions: ResourceAction[] };

/** The link's level as stored; `none` without a link. */
export function linkLevel(token: PermissionToken | null | undefined, resource: ShareResource): ShareLevel {
  return token ? shareLevelOf(token.permissions, resource.type, resource.id) : ShareLevel.None;
}

/**
 * What Apply does with the link (v1 `ShareStore.shareAnyone`): nothing without a link or when the level is unchanged,
 * a revoke for Remove access, else the new actions.
 */
export function linkChange(token: PermissionToken | null | undefined, resource: ShareResource, picked: ShareLevel | undefined): LinkChange {
  if (!token || picked === undefined || picked === linkLevel(token, resource)) return { kind: 'keep' };
  if (picked === ShareLevel.None) return { kind: 'revoke' };
  return { kind: 'update', actions: [...SHARE_LEVEL_ACTIONS[picked]] };
}
