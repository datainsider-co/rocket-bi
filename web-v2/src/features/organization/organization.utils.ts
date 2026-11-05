import { ORGANIZATION_SETTINGS_PATH } from '@/app/layout/header/header.utils';

/** Permissions the Organization Settings pages check for the logged-in user, asked for in one request. */
export const OrgPermission = {
  manageConnection: 'organization:manage:connection',
  viewUsers: 'user:view:*',
  createUsers: 'user:create:*',
  editUsers: 'user:edit:*',
  resetPasswords: 'user:reset_password:*',
  suspendUsers: 'user:suspend:*',
  deleteUsers: 'user:delete:*',
  viewPermissions: 'permission:view:*',
  assignPermissions: 'permission:assign:*',
  manageLoginMethod: 'login_method:manage'
} as const;

export type OrgPermission = (typeof OrgPermission)[keyof typeof OrgPermission];

export const ORG_PERMISSIONS: readonly OrgPermission[] = Object.values(OrgPermission);

/** What the logged-in user may do here; a permission the server didn't answer is not granted. */
export type OrgPermissions = Readonly<Record<OrgPermission, boolean>>;

export function toOrgPermissions(answers: Readonly<Record<string, boolean>>): OrgPermissions {
  return Object.fromEntries(ORG_PERMISSIONS.map(permission => [permission, answers[permission] === true])) as OrgPermissions;
}

export const OrganizationSection = {
  Users: 'user-management',
  DataSource: 'clickhouse-config'
} as const;

export type OrganizationSection = (typeof OrganizationSection)[keyof typeof OrganizationSection];

export interface OrganizationSectionConfig {
  readonly key: OrganizationSection;
  readonly title: string;
  /** v1 icon font class. */
  readonly icon: string;
  readonly path: string;
  /** Needed to see the section. */
  readonly permission: OrgPermission;
}

/** v1 `OrganizationSettings.vue` sidebar, keeping only the pages migrated so far (v1's paths). */
export const ORGANIZATION_SECTIONS: readonly OrganizationSectionConfig[] = [
  {
    key: OrganizationSection.Users,
    title: 'User Managements',
    icon: 'di-icon-users',
    path: `${ORGANIZATION_SETTINGS_PATH}/${OrganizationSection.Users}`,
    permission: OrgPermission.viewUsers
  },
  {
    key: OrganizationSection.DataSource,
    title: 'DataSource Config',
    icon: 'di-icon-my-data',
    path: `${ORGANIZATION_SETTINGS_PATH}/${OrganizationSection.DataSource}`,
    permission: OrgPermission.manageConnection
  }
];

export function getOrganizationSection(key: OrganizationSection): OrganizationSectionConfig {
  const section = ORGANIZATION_SECTIONS.find(item => item.key === key);
  if (!section) throw new Error(`Unknown organization section: ${key}`);
  return section;
}

export function visibleSections(permissions: OrgPermissions): OrganizationSectionConfig[] {
  return ORGANIZATION_SECTIONS.filter(section => permissions[section.permission]);
}

/** The section `pathname` is in (`/settings/organization/<section>/...`), if any. */
export function organizationSectionFromPath(pathname: string): OrganizationSection | undefined {
  if (!pathname.startsWith(`${ORGANIZATION_SETTINGS_PATH}/`)) return undefined;
  const segment = pathname.slice(ORGANIZATION_SETTINGS_PATH.length + 1).split('/')[0];
  return ORGANIZATION_SECTIONS.find(section => section.key === segment)?.key;
}

/** v1 route `user-management/:username`. */
export function userDetailPath(username: string): string {
  return `${getOrganizationSection(OrganizationSection.Users).path}/${encodeURIComponent(username)}`;
}
