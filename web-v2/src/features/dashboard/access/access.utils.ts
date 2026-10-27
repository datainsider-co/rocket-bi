import { ALL_RESOURCE_ACTIONS, ResourceAction } from '@/core/permission/ResourcePermissionService';
import { hashPassword } from '@/shared/security/hashPassword';

/** What the viewer may do on the dashboard (v1 `DashboardModeStore.can*`, `PermissionWidget`). */
export interface DashboardPermissions {
  canEdit: boolean;
  canDownload: boolean;
  canCopy: boolean;
  canDelete: boolean;
  canCreate: boolean;
  /** v1 offered Share to `*` only. */
  canShare: boolean;
}

/** Each permission from the granted actions; `*` grants them all. */
export function permissionsOf(actions: readonly string[]): DashboardPermissions {
  const all = actions.includes(ResourceAction.All);
  const can = (action: ResourceAction) => all || actions.includes(action);
  return {
    canEdit: can(ResourceAction.Edit),
    canDownload: can(ResourceAction.Download),
    canCopy: can(ResourceAction.Copy),
    canDelete: can(ResourceAction.Delete),
    canCreate: can(ResourceAction.Create),
    canShare: all
  };
}

/** The owner may do everything without asking the server (v1 `DashboardDetail.loadPermissions`). */
export const OWNER_PERMISSIONS = permissionsOf(ALL_RESOURCE_ACTIONS);

/** Until the server answers, nothing beyond viewing. */
export const VIEW_ONLY = permissionsOf([ResourceAction.View]);

/** v1 `PasswordModal.requirePassword`: a password is asked of everyone but the owner, once it is on. */
export function needsPassword(directory: { passwordEnabled: boolean; ownerId: string }, username: string): boolean {
  return directory.passwordEnabled && directory.ownerId !== username;
}

/** Why the password can't open the dashboard, or `undefined` when it can (v1 `PasswordModal.validate`). */
export function passwordError(password: string, hashedPassword: string): string | undefined {
  if (password === '') return 'Password is required!';
  if (hashedPassword === '') return 'Password not found!';
  return hashPassword(password) === hashedPassword ? undefined : 'Password is incorrect!';
}
