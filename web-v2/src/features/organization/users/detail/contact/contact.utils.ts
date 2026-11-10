import { UserGroup } from '@/core/admin/UserGroup';
import { OrgPermission, type OrgPermissions } from '../../../organization.utils';

/** What the viewer may do on this user's page. Nobody suspends, deletes or demotes themselves from here. */
export interface ContactAbilities {
  readonly editProfile: boolean;
  readonly changeRole: boolean;
  readonly resetPassword: boolean;
  readonly suspend: boolean;
  readonly delete: boolean;
  readonly viewPrivileges: boolean;
  readonly assignPrivileges: boolean;
}

export function contactAbilities(permissions: OrgPermissions | undefined, isSelf: boolean, userGroup: UserGroup): ContactAbilities {
  const can = (permission: OrgPermission) => permissions?.[permission] === true;
  return {
    editProfile: can(OrgPermission.editUsers),
    // The owner (`None`) is outside the groups; the server can't move them.
    changeRole: can(OrgPermission.assignPermissions) && !isSelf && userGroup !== UserGroup.None,
    resetPassword: can(OrgPermission.resetPasswords),
    suspend: can(OrgPermission.suspendUsers) && !isSelf,
    delete: can(OrgPermission.deleteUsers) && !isSelf,
    viewPrivileges: can(OrgPermission.viewPermissions),
    assignPrivileges: can(OrgPermission.assignPermissions)
  };
}

/**
 * The server resets to its configured default password and doesn't say which; show it only when the deployment tells
 * the client (`VITE_DEFAULT_PASSWORD`). v1 always showed its own config value, which could differ from the server's.
 */
export function resetPasswordText(defaultPassword: string): string {
  return defaultPassword
    ? `The password was reset to ${defaultPassword}.`
    : "The password was reset to the server's default password.";
}

export function roleChangeText(name: string, to: UserGroup, dropped: readonly string[]): string {
  if (to !== UserGroup.Viewer) return `Make ${name} an ${to}?`;
  return dropped.length > 0
    ? `Make ${name} a Viewer? A Viewer can only hold view permissions, so these are removed: ${dropped.join(', ')}.`
    : `Make ${name} a Viewer?`;
}
