import { DirectoryType } from '@/core/directory/Directory';
import type { Directory } from '@/core/directory/Directory';
import type { DatabaseEntry } from '@/core/schema/DatabaseService';
import { ShareLevel } from '@/core/share/shareLevel';
import { dashboardPath, toIdParam } from '@/shared/routing/idParam';

/**
 * What the dialog shares. Dashboards and queries are shared through their directory, like v1; a database by its name,
 * with people only (no link, no password).
 */
export type ShareTarget =
  | {
      type: 'directory';
      /** Directory id. */
      id: number;
      name: string;
      /** Username of the owner; only the owner may set a password. */
      owner: string;
    }
  | { type: 'database'; id: string; name: string; owner: string };

/** Whose users the people section reads and changes. */
export type PeopleResource = { type: 'directory'; id: number } | { type: 'database'; id: string };

export function peopleResourceOf(target: ShareTarget): PeopleResource {
  return target.type === 'directory' ? { type: target.type, id: target.id } : { type: target.type, id: target.id };
}

/** Which page the link opens. */
export const ShareLinkKind = {
  Dashboard: 'dashboard',
  Folder: 'folder',
  Query: 'query'
} as const;

export type ShareLinkKind = (typeof ShareLinkKind)[keyof typeof ShareLinkKind];

export interface ShareOptions {
  /** Offers Get link when given. */
  link?: ShareLinkKind;
  /** The dashboard (or query) id behind the directory: the link and the embed code use it. */
  dashboardId?: number;
  /** Offers Password protection to the owner (dashboards and queries, v1). */
  password?: boolean;
  /** Offers Copy embed code (dashboards, v1). */
  embed?: boolean;
}

export interface LevelOption {
  value: ShareLevel;
  label: string;
}

/** v1 `PERMISSION_ACTION_NODES`, highest first. */
const LEVEL_OPTIONS: readonly LevelOption[] = [
  { value: ShareLevel.Edit, label: 'Edit' },
  { value: ShareLevel.ViewAndDownload, label: 'View & Download' },
  { value: ShareLevel.View, label: 'View' },
  { value: ShareLevel.None, label: 'Remove access' }
];

/** v1 offered View & Download only on directories, dashboards and queries. */
export function levelOptions(withDownload: boolean): LevelOption[] {
  return LEVEL_OPTIONS.filter(option => withDownload || option.value !== ShareLevel.ViewAndDownload);
}

/** The collapsed people section: who it is shared with, the first ten names. */
export function sharedSummary(names: readonly string[]): string {
  return names.length === 0 ? 'No one has been added yet' : `Shared with ${names.slice(0, 10).join(', ')}`;
}

/** v1 says "view" for every level but edit. */
export function linkSummary(level: ShareLevel): string {
  return `Anyone on the internet with this link can ${level === ShareLevel.Edit ? 'edit' : 'view'}`;
}

export interface LinkParams {
  origin: string;
  target: { id: number; name: string };
  dashboardId?: number;
  tokenId: string;
}

/** v1 `UrlUtils.createLinkShare`: the page the link opens, with its token. */
export function shareLink(kind: ShareLinkKind, { origin, target, dashboardId, tokenId }: LinkParams): string {
  const token = encodeURIComponent(tokenId);
  switch (kind) {
    case ShareLinkKind.Dashboard:
      return `${origin}${dashboardPath(dashboardId ?? 0, target.name)}?token=${token}`;
    case ShareLinkKind.Query:
      return `${origin}/data-warehouse/query-editor?token=${token}&adhoc=${dashboardId ?? 0}`;
    case ShareLinkKind.Folder:
      return `${origin}/shared/${toIdParam(target.id, target.name)}?token=${token}`;
  }
}

/** v1 `UrlUtils.createDashboardEmbedCode`, on one line. The embedded route reads a bare id too. */
export function embedCode(origin: string, dashboardId: number, tokenId: string): string {
  const source = `${origin}/embedded/dashboard/${dashboardId}?token=${encodeURIComponent(tokenId)}`;
  return `<iframe id="datainsider-dashboard-iframe" width="1280" height="720" src="${source}" title="RocketBI Dashboard" frameborder="0"></iframe>`;
}

export interface ShareRequest {
  target: ShareTarget;
  options: ShareOptions;
}

/**
 * What the dialog offers for a directory entry (v1 `DirectoryListing.showShareModal`): a folder gets a folder link; a
 * dashboard its link, password and embed code; a query its link and password.
 */
export function directoryShare(
  directory: Pick<Directory, 'id' | 'name' | 'owner' | 'ownerId' | 'directoryType' | 'dashboardId'>
): ShareRequest {
  const target: ShareTarget = { type: 'directory', id: directory.id, name: directory.name, owner: directory.owner.username || directory.ownerId };
  switch (directory.directoryType) {
    case DirectoryType.Dashboard:
      return { target, options: { link: ShareLinkKind.Dashboard, dashboardId: directory.dashboardId, password: true, embed: true } };
    case DirectoryType.Query:
      return { target, options: { link: ShareLinkKind.Query, dashboardId: directory.dashboardId, password: true } };
    default:
      return { target, options: { link: ShareLinkKind.Folder } };
  }
}

/** Sharing a database (v1 `ShareDatabaseHandler`): people only, without View & Download (v1 offered it on directories). */
export function databaseShare(entry: Pick<DatabaseEntry, 'name' | 'displayName' | 'owner' | 'creatorId'>): ShareRequest {
  return { target: { type: 'database', id: entry.name, name: entry.displayName, owner: entry.owner?.username || entry.creatorId }, options: {} };
}
