import { ResourceAction } from '@/core/permission/ResourcePermissionService';
import type { ResourceType } from '@/core/permission/ResourcePermissionService';

/** What a user or a link may do, as the share dialog offers it (v1 `ActionType` edit / view_and_download / view / none). */
export const ShareLevel = {
  Edit: 'edit',
  ViewAndDownload: 'view_and_download',
  View: 'view',
  None: 'none'
} as const;

export type ShareLevel = (typeof ShareLevel)[keyof typeof ShareLevel];

/** The actions sent for each level (v1 `ActionTypeMapActions`). `none` removes the access. */
export const SHARE_LEVEL_ACTIONS: Readonly<Record<ShareLevel, readonly ResourceAction[]>> = {
  [ShareLevel.Edit]: [
    ResourceAction.View,
    ResourceAction.Download,
    ResourceAction.Edit,
    ResourceAction.Copy,
    ResourceAction.Delete,
    ResourceAction.Create
  ],
  [ShareLevel.ViewAndDownload]: [ResourceAction.View, ResourceAction.Download],
  [ShareLevel.View]: [ResourceAction.View],
  [ShareLevel.None]: []
};

/** The action of a permission `{orgId}:{type}:{action}:{id}` when it is on this resource. */
function actionOn(permission: string, type: ResourceType, id: number): string | undefined {
  const [, permissionType, action, permissionId] = permission.split(':');
  return permissionType === type && permissionId === String(id) ? action : undefined;
}

/**
 * The level the permissions give on one resource (v1 `PermissionProviders.getActionType`): edit wins, then view and
 * download, then view. The organization part is not compared: the server only sends the user's own organization.
 */
export function shareLevelOf(permissions: readonly string[], type: ResourceType, id: number): ShareLevel {
  const actions = new Set(permissions.map(permission => actionOn(permission, type, id)));
  if (actions.has(ResourceAction.Edit)) return ShareLevel.Edit;
  if (actions.has(ResourceAction.View) && actions.has(ResourceAction.Download)) return ShareLevel.ViewAndDownload;
  if (actions.has(ResourceAction.View)) return ShareLevel.View;
  return ShareLevel.None;
}
