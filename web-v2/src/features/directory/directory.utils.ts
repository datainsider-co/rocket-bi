import { z } from 'zod';
import { dashboardPath, toIdParam } from '@/shared/routing/idParam';
import { DefaultDirectoryId, DirectoryType } from '@/core/directory/Directory';
import type { Directory, DirectoryParents } from '@/core/directory/Directory';
import { SortOrder } from '@/core/directory/DirectoryService';
import type { DirectorySort } from '@/core/directory/DirectoryService';

/** The five listings of v1's directory screen, keyed by their URL segment. */
export const DirectorySection = {
  MyData: 'mydata',
  Shared: 'shared',
  Recent: 'recent',
  Starred: 'starred',
  Trash: 'trash'
} as const;

export type DirectorySection = (typeof DirectorySection)[keyof typeof DirectorySection];

export interface SectionConfig {
  key: DirectorySection;
  /** Page title. */
  title: string;
  /** Sidebar label. */
  navLabel: string;
  /** v1 icon font class. */
  icon: string;
  path: string;
  /** The listing shown at `path` without a folder. */
  rootId: number;
}

/** In sidebar order. Titles and icons are v1's (`DirectoryListing.vue` and the listing handlers). */
export const SECTIONS: readonly SectionConfig[] = [
  {
    key: DirectorySection.MyData,
    title: 'All Data',
    navLabel: 'All Data',
    icon: 'di-icon-my-data',
    path: '/mydata',
    rootId: DefaultDirectoryId.MyData
  },
  {
    key: DirectorySection.Shared,
    title: 'Shared With Me',
    navLabel: 'Shared With Me',
    icon: 'di-icon-share-with-me',
    path: '/shared',
    rootId: DefaultDirectoryId.SharedWithMe
  },
  {
    key: DirectorySection.Recent,
    title: 'Recent',
    navLabel: 'Recent',
    icon: 'di-icon-recent',
    path: '/recent',
    rootId: DefaultDirectoryId.Recent
  },
  {
    key: DirectorySection.Starred,
    title: 'Starred',
    navLabel: 'Starred',
    icon: 'di-icon-star',
    path: '/starred',
    rootId: DefaultDirectoryId.Starred
  },
  {
    key: DirectorySection.Trash,
    title: 'Trash',
    navLabel: 'Trash',
    icon: 'di-icon-delete',
    path: '/trash',
    rootId: DefaultDirectoryId.Trash
  }
];

export function getSection(key: DirectorySection): SectionConfig {
  const section = SECTIONS.find(item => item.key === key);
  if (!section) throw new Error(`Unknown directory section: ${key}`);
  return section;
}

/** The section whose path `pathname` is, or is below. Defaults to My Data. */
export function sectionFromPath(pathname: string): DirectorySection {
  const segment = pathname.split('/')[1] ?? '';
  return SECTIONS.find(section => section.key === segment)?.key ?? DirectorySection.MyData;
}

export function folderPath(id: number, name: string): string {
  return `/mydata/${toIdParam(id, name)}`;
}


/**
 * Where clicking a row goes. Folders always open under My Data, whatever the section, as in v1. Saved queries open in
 * the query editor.
 */
export function itemPath(directory: Pick<Directory, 'id' | 'name' | 'directoryType' | 'dashboardId'>): string {
  switch (directory.directoryType) {
    case DirectoryType.Dashboard:
      return dashboardPath(directory.dashboardId, directory.name);
    case DirectoryType.Query:
      return `/data-warehouse/query-editor?adhoc=${directory.dashboardId}`;
    default:
      return folderPath(directory.id, directory.name);
  }
}

export interface Breadcrumb {
  key: string;
  label: string;
  /** Missing for the `...` placeholder of a shortened path. */
  to?: string;
}

/**
 * v1 `BreadCrumbUtils`: the folders from below the root down to the current one. When the path does not start at
 * the root (a folder shared with the user) and is three or more deep, the first folder becomes `...`.
 */
export function toBreadcrumbs(parents: DirectoryParents | undefined): Breadcrumb[] {
  if (!parents) return [];
  const folders = parents.parentDirectories;
  const crumbs: Breadcrumb[] = folders
    .filter(folder => folder.parentId > 0)
    .map(folder => ({ key: String(folder.id), label: folder.name, to: folderPath(folder.id, folder.name) }));
  const startsAtRoot = folders[0]?.parentId === -1;
  if (startsAtRoot || folders.length < 3) return crumbs;
  return [{ key: 'more', label: '...' }, ...crumbs.slice(1)];
}

export const DEFAULT_SORT: DirectorySort = { field: 'name', order: SortOrder.Asc };

export function toggleSortOrder(order: SortOrder): SortOrder {
  return order === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
}

/** The root of Trash lists the latest deleted first, then by the chosen sort (v1 `TrashDirectoryListingHandler`). */
export function buildSorts(directoryId: number, sort: DirectorySort): DirectorySort[] {
  if (directoryId === DefaultDirectoryId.Trash) {
    return [{ field: 'updated_date', order: SortOrder.Desc }, sort];
  }
  return [sort];
}

/**
 * Where `New` creates an item: the open folder under My Data, the root everywhere else. v1 passed the section's
 * virtual id (-4 for Starred, ...), which the backend rejects.
 */
export function createParentId(section: DirectorySection, folderId: number | undefined): number {
  return section === DirectorySection.MyData && folderId !== undefined ? folderId : DefaultDirectoryId.MyData;
}

export const DirectoryAction = {
  Rename: 'rename',
  Move: 'move',
  Star: 'star',
  Unstar: 'unstar',
  Remove: 'remove'
} as const;

export type DirectoryAction = (typeof DirectoryAction)[keyof typeof DirectoryAction];

/** v1's settings menu, without Duplicate and Copy (they need the dashboard model and its password check). */
export function menuActions(directory: Pick<Directory, 'isStarred'>, section: DirectorySection): DirectoryAction[] {
  const actions: DirectoryAction[] = [DirectoryAction.Rename];
  if (section === DirectorySection.MyData) actions.push(DirectoryAction.Move);
  actions.push(directory.isStarred ? DirectoryAction.Unstar : DirectoryAction.Star, DirectoryAction.Remove);
  return actions;
}

/** v1 shows the type as stored, so `queries` reads "delete queries 'x'". v2 uses readable words. */
export function typeLabel(type: DirectoryType): string {
  switch (type) {
    case DirectoryType.Dashboard:
      return 'dashboard';
    case DirectoryType.Query:
      return 'query';
    default:
      return 'folder';
  }
}

/** v1 `DirectoryRename`/`DiRenameModal` rules. */
export const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Field is required.')
    .max(250, 'Max length is 250 chars.')
    .regex(/^[^\\/?*"><:|]*$/, 'Field can\'t contain any of the following characters: /\\"?*><:|')
});

export type NameForm = z.infer<typeof nameSchema>;

/** Folders under `directories`, minus the ones that can't be a move target (the item being moved). */
export function movableFolders(directories: readonly Directory[], excludeIds: readonly number[]): Directory[] {
  return directories.filter(item => item.isFolder && !excludeIds.includes(item.id));
}

/** v1 `DateTimeCell` (`MMM DD, YYYY HH:mm:ss`): `Mar 04, 2026 14:05:09`; `--` for an unknown (0) date. */
export function formatDateTime(epochMillis: number, timeZone?: string): string {
  if (epochMillis <= 0) return '--';
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  };
  if (timeZone) options.timeZone = timeZone;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(epochMillis);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('month')} ${part('day')}, ${part('year')} ${part('hour')}:${part('minute')}:${part('second')}`;
}

/** v1 `HtmlElementRenderUtils.backgrounds`: the fallback avatar's color, picked by the name's first letter. */
const AVATAR_COLORS = [
  '#1abc9c',
  '#2ecc71',
  '#3498db',
  '#72BD64',
  '#68B4B4',
  '#16a085',
  '#27ae60',
  '#2980b9',
  '#72BD64',
  '#FF6FA9',
  '#f1c40f',
  '#e67e22',
  '#e74c3c',
  '#9BC1ED',
  '#f39c12',
  '#d35400',
  '#c0392b',
  '#FF8EFF',
  '#45C7C6'
] as const;

export function avatarColor(name: string): string {
  const code = name.toUpperCase().charCodeAt(0);
  return AVATAR_COLORS[(Number.isNaN(code) ? 0 : code) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}
