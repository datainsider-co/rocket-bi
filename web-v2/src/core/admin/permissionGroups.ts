import { UserGroup } from './UserGroup';

export interface PermissionItem {
  readonly label: string;
  readonly permission: string;
}

/**
 * A section of the privileges editor. `sudo` grants every item of the group on the server (`user:*:*` answers
 * `user:view:*` as permitted), so the "All" checkbox stands for it.
 */
export interface PermissionGroup {
  readonly name: string;
  readonly sudo?: string;
  readonly items: readonly PermissionItem[];
}

/** v1 `SupportPermissionGroups`, in v1's order (Data Lake and CDP were commented out there). */
export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    name: 'Organization',
    sudo: 'organization:*:*',
    items: [
      { label: 'DataSource Configuration', permission: 'organization:manage:connection' },
      { label: 'Edit Organization', permission: 'organization:edit:*' },
      { label: 'Delete Organization', permission: 'organization:delete:*' }
    ]
  },
  {
    name: 'User Management',
    sudo: 'user:*:*',
    items: [
      { label: 'View Users', permission: 'user:view:*' },
      { label: 'Add New Users', permission: 'user:create:*' },
      { label: 'Edit Users', permission: 'user:edit:*' },
      { label: 'Reset Password', permission: 'user:reset_password:*' },
      { label: 'Suspend Users', permission: 'user:suspend:*' },
      { label: 'Delete Users', permission: 'user:delete:*' },
      { label: 'View User Permissions', permission: 'permission:view:*' },
      { label: 'Assign User Permissions', permission: 'permission:assign:*' },
      { label: 'Manage Login Method', permission: 'login_method:manage' },
      { label: 'View User Activities', permission: 'user_activity:view:*' }
    ]
  },
  { name: 'Billing Management', sudo: 'billing:*:*', items: [{ label: 'Change Plan', permission: 'billing:edit:*' }] },
  {
    name: 'Ingestion DataSource',
    sudo: 'ingestion_source:*:*',
    items: [
      { label: 'View DataSources', permission: 'ingestion_source:view:*' },
      { label: 'Add DataSources', permission: 'ingestion_source:create:*' },
      { label: 'Edit DataSources', permission: 'ingestion_source:edit:*' },
      { label: 'Delete DataSources', permission: 'ingestion_source:delete:*' }
    ]
  },
  {
    name: 'Ingestion Job',
    sudo: 'ingestion_job:*:*',
    items: [
      { label: 'View Jobs', permission: 'ingestion_job:view:*' },
      { label: 'Add Jobs', permission: 'ingestion_job:create:*' },
      { label: 'Edit Jobs', permission: 'ingestion_job:edit:*' },
      { label: 'Delete Jobs', permission: 'ingestion_job:delete:*' },
      { label: 'Force Sync', permission: 'ingestion_job:force_run:*' },
      { label: 'Kill Jobs', permission: 'ingestion_job:kill:*' },
      { label: 'View Job Histories', permission: 'ingestion_history:view:*' }
    ]
  },
  {
    name: 'Data Warehouse',
    sudo: 'database:*:*',
    items: [
      { label: 'View Databases', permission: 'database:view:*' },
      { label: 'Create Databases', permission: 'database:create:*' },
      { label: 'Rename Databases', permission: 'database:edit:*' },
      { label: 'Delete Databases', permission: 'database:delete:*' },
      { label: 'Share Databases', permission: 'database:share:*' },
      { label: 'Query Analysis', permission: 'query_analysis:*:*' },
      { label: 'Manage Relationship', permission: 'relationship:*:*' },
      { label: 'Manage RLS', permission: 'rls:*:*' }
    ]
  },
  { name: 'Insights', items: [{ label: 'Enable', permission: 'insight:*:*' }] },
  { name: 'DataCook', items: [{ label: 'Enable', permission: 'etl:*:*' }] },
  { name: 'API Key', items: [{ label: 'Manage API key', permission: 'apikey:*:*' }] }
];

/** What v1 granted a new Editor; Viewers got nothing the server accepts. */
export const EDITOR_INITIAL_PERMISSIONS: readonly string[] = ['insight:*:*', 'query_analysis:*:*'];

export function groupPermissions(group: PermissionGroup): string[] {
  return [...(group.sudo ? [group.sudo] : []), ...group.items.map(item => item.permission)];
}

export const CATALOG_PERMISSIONS: readonly string[] = PERMISSION_GROUPS.flatMap(groupPermissions);

/** The server lets a Viewer hold only permissions with `:view:` in them. */
export function isViewPermission(permission: string): boolean {
  return permission.includes(':view:');
}

export function canHold(userGroup: UserGroup, permission: string): boolean {
  return userGroup !== UserGroup.Viewer || isViewPermission(permission);
}

/** The catalog permissions `is_permitted` answered as granted. */
export function selectionFromPermitted(answers: Readonly<Record<string, boolean>>): string[] {
  return CATALOG_PERMISSIONS.filter(permission => answers[permission] === true);
}

/** Catalog permissions stored for the user (`UserInfo.permissions`, `<orgId>:` prefix dropped). */
export function storedCatalogPermissions(userPermissions: readonly string[]): string[] {
  const stored = new Set(userPermissions.map(permission => permission.replace(/^\d+:/, '')));
  return CATALOG_PERMISSIONS.filter(permission => stored.has(permission));
}

export function isGroupAllSelected(selection: readonly string[], group: PermissionGroup): boolean {
  return group.items.every(item => selection.includes(item.permission));
}

/** "All" ticked selects the sudo and every item; unticked clears the group. */
export function setGroupAll(selection: readonly string[], group: PermissionGroup, checked: boolean): string[] {
  const permissions = groupPermissions(group);
  const rest = selection.filter(permission => !permissions.includes(permission));
  return checked ? [...rest, ...permissions] : rest;
}

/**
 * Ticks or unticks one item. Unticking drops the sudo (it would still grant the item); ticking the last missing item
 * adds it, like v1.
 */
export function setPermission(
  selection: readonly string[],
  group: PermissionGroup,
  permission: string,
  checked: boolean
): string[] {
  const rest = selection.filter(item => item !== permission && item !== group.sudo);
  if (!checked) return rest;
  const next = [...rest, permission];
  return group.sudo && isGroupAllSelected(next, group) ? [...next, group.sudo] : next;
}

/** What should be stored for a group: its sudo when "All" is on, otherwise the ticked items. */
function groupTarget(selection: readonly string[], group: PermissionGroup): string[] {
  if (group.sudo && selection.includes(group.sudo)) return [group.sudo];
  return group.items.map(item => item.permission).filter(permission => selection.includes(permission));
}

function sameSelection(a: readonly string[], b: readonly string[], group: PermissionGroup): boolean {
  return groupPermissions(group).every(permission => a.includes(permission) === b.includes(permission));
}

export interface PermissionChanges {
  readonly include: string[];
  readonly exclude: string[];
}

/**
 * The request that turns `initial` into `selection` (both as `is_permitted` answers), given what is `stored`. Only
 * groups the admin changed are sent, so permissions set elsewhere stay; inside one, unticking an item under a stored
 * sudo excludes the sudo and includes the items still ticked.
 */
export function permissionChanges(
  initial: readonly string[],
  selection: readonly string[],
  stored: readonly string[]
): PermissionChanges {
  const include: string[] = [];
  const exclude: string[] = [];
  for (const group of PERMISSION_GROUPS) {
    if (sameSelection(initial, selection, group)) continue;
    const target = groupTarget(selection, group);
    const storedInGroup = groupPermissions(group).filter(permission => stored.includes(permission));
    include.push(...target.filter(permission => !stored.includes(permission)));
    exclude.push(...storedInGroup.filter(permission => !target.includes(permission)));
    // Ticked before, unticked now, yet not stored: granted some other way; asking to exclude it is all there is.
    exclude.push(
      ...groupPermissions(group).filter(
        permission =>
          initial.includes(permission) && !selection.includes(permission) && !storedInGroup.includes(permission)
      )
    );
  }
  return { include, exclude: [...new Set(exclude)] };
}

/** Permissions a user moving to Viewer must lose: the server keeps them through the group change. */
export function permissionsToDropForViewer(stored: readonly string[]): string[] {
  return stored.filter(permission => !isViewPermission(permission));
}
