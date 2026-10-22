import Deneric from 'deneric2';
import { UserProfile } from '@/core/user/UserProfile';

/** Values of the backend's `directory_type`. */
export const DirectoryType = {
  Directory: 'directory',
  Dashboard: 'dashboard',
  /** An ad-hoc query saved from the query editor. */
  Query: 'queries'
} as const;

export type DirectoryType = (typeof DirectoryType)[keyof typeof DirectoryType];

/**
 * Virtual ids the backend accepts in place of a real directory id. `MyData` (-1) means the user's root directory in
 * `directories/{id}/list` and `directories/create`; the others only exist on the client, as in v1.
 */
export const DefaultDirectoryId = {
  MyData: -1,
  SharedWithMe: -2,
  Recent: -3,
  Starred: -4,
  Trash: -5
} as const;

/**
 * A folder, dashboard or saved query in the directory tree. Field names follow the backend (`directories/*`).
 * `dashboard_id` is only sent for dashboards and queries; it parses to 0 otherwise (dashboard ids start at 1).
 */
export class Directory extends Deneric {
  id = 0;
  name = '';
  owner = new UserProfile();
  ownerId = '';
  parentId = 0;
  directoryType: DirectoryType = DirectoryType.Directory;
  dashboardId = 0;
  isStarred = false;
  createdDate = 0;
  updatedDate = 0;

  constructor(json?: unknown) {
    super({
      id: ['id', Number],
      name: ['name', String],
      owner: ['owner', UserProfile],
      ownerId: ['owner_id', String],
      parentId: ['parent_id', Number],
      directoryType: ['directory_type', String],
      dashboardId: ['dashboard_id', Number],
      isStarred: ['is_starred', Boolean],
      createdDate: ['created_date', Number],
      updatedDate: ['updated_date', Number]
    });
    this.fromJson(json);
  }

  get isFolder(): boolean {
    return this.directoryType === DirectoryType.Directory;
  }
}

/**
 * `GET directories/{id}/parents`: the path from the user's root down to `id`, both included. `is_all` is false when
 * the user can only see part of the path (a folder shared with them); the path then starts below the root.
 */
export class DirectoryParents extends Deneric {
  rootDirectory = new Directory();
  isAll = false;
  parentDirectories: Directory[] = [];

  constructor(json?: unknown) {
    super({
      rootDirectory: ['root_directory', Directory],
      isAll: ['is_all', Boolean],
      parentDirectories: ['parent_directories', Deneric.Array(Directory)]
    });
    this.fromJson(json);
  }
}
