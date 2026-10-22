/** A page the header links to. Paths follow v1 (`web/src/router/Router.ts`) so links keep working as pages land. */
export interface HeaderLink {
  key: string;
  label: string;
  to: string;
}

/** A top-level header entry: a plain link, or a group whose links open in a dropdown. */
export interface HeaderNavItem {
  key: 'dashboards' | 'data-warehouse';
  label: string;
  to: string;
  /** Path prefixes that highlight this entry. */
  activePaths: readonly string[];
  children?: readonly HeaderLink[];
}

/** v1 `HeaderBar.vue`. Lake House, Data Ingestion and CDP are left out: v1 turns them off in every environment. */
export const HEADER_NAV_ITEMS: readonly HeaderNavItem[] = [
  {
    key: 'dashboards',
    label: 'Dashboards',
    to: '/mydata',
    activePaths: ['/mydata', '/shared', '/recent', '/starred', '/trash', '/dashboard']
  },
  {
    key: 'data-warehouse',
    label: 'Data Warehouse',
    to: '/data-warehouse',
    activePaths: ['/data-warehouse'],
    children: [
      { key: 'data-management', label: 'Data Management', to: '/data-warehouse/databases/all' },
      { key: 'schema', label: 'Schema', to: '/data-warehouse/schema' },
      { key: 'query-analysis', label: 'Query Analysis', to: '/data-warehouse/query-editor' },
      { key: 'relationship', label: 'Relationship', to: '/data-warehouse/relationship' },
      { key: 'data-cook', label: 'Data Cook', to: '/data-warehouse/data-cook' }
    ]
  }
];

export const USER_PROFILE_PATH = '/settings/user-profile/me';
export const ORGANIZATION_SETTINGS_PATH = '/settings/organization';
export const SETTINGS_PATHS: readonly string[] = ['/settings'];

/** Shown when the organization has no name yet. */
export const DEFAULT_BRAND_NAME = 'RocketBI';
export const DEFAULT_LOGO_URL = '/app/logo.svg';

/** True when `pathname` is one of `prefixes` or below it. `/mydata` matches `/mydata/x` but not `/mydatax`. */
export function isPathActive(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Keys of the links that match `pathname`, for a menu's `selectedKeys`. */
export function activeLinkKeys(pathname: string, links: readonly HeaderLink[]): string[] {
  return links.filter(link => isPathActive(pathname, [link.to])).map(link => link.key);
}

export function brandName(organizationName: string): string {
  return organizationName.trim() || DEFAULT_BRAND_NAME;
}

/** Letter for the avatar when the user has no picture (v1 drew one from the name). */
export function avatarInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase();
}

/** Keys to select in the mobile menu: the active plain entries and the active links inside groups. */
export function activeNavKeys(pathname: string, items: readonly HeaderNavItem[]): string[] {
  return items.flatMap(item =>
    item.children ? activeLinkKeys(pathname, item.children) : isPathActive(pathname, item.activePaths) ? [item.key] : []
  );
}
