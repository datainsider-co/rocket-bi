import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asRecord } from '@/core/json/json';
import { Directory, DirectoryParents, DirectoryType } from './Directory';

export const SortOrder = {
  Asc: 'ASC',
  Desc: 'DESC'
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

/** `field` is a backend column name (snake_case), such as `name` or `updated_date`. */
export interface DirectorySort {
  field: string;
  order: SortOrder;
}

/**
 * The directory tree of the current user. Listing calls take sorts only: the backend pages them, but v1 never did
 * and always asked for 10 000 rows, so v2 does the same until paging is built.
 */
export interface DirectoryService {
  get(id: number): Promise<Directory>;
  /** The user's root directory, the real directory behind `DefaultDirectoryId.MyData`. */
  getRoot(): Promise<Directory>;
  getParents(id: number): Promise<DirectoryParents>;
  /** Children of `id`. `DefaultDirectoryId.MyData` lists the root. */
  list(id: number, sorts: readonly DirectorySort[]): Promise<Directory[]>;
  listSharedWithMe(id: number, sorts: readonly DirectorySort[]): Promise<Directory[]>;
  listRecent(sorts: readonly DirectorySort[]): Promise<Directory[]>;
  listStarred(sorts: readonly DirectorySort[]): Promise<Directory[]>;
  listTrash(sorts: readonly DirectorySort[]): Promise<Directory[]>;
  /** Creates a folder. `parentId` may be `DefaultDirectoryId.MyData` for the root. */
  createFolder(name: string, parentId: number): Promise<Directory>;
  rename(id: number, name: string): Promise<void>;
  move(id: number, toParentId: number): Promise<void>;
  /** Moves to trash. */
  remove(id: number): Promise<void>;
  /** Deletes for good; only for items in trash. */
  deleteForever(id: number): Promise<void>;
  restore(id: number): Promise<void>;
  star(id: number): Promise<void>;
  unstar(id: number): Promise<void>;
  /**
   * Sets a dashboard's or query's password (`data.config`, sha256 hex of it), or removes it when `hashedPassword` is
   * `undefined`. The server only updates a whole directory, so the rest is sent back as it was read.
   */
  setPassword(id: number, hashedPassword: string | undefined): Promise<void>;
}

export const DirectoryService = token<DirectoryService>('DirectoryService');

/** v1 `DirectoryPagingRequest`: `size: 0` became 10 000 there, see the interface note. */
const PAGE_SIZE = 10_000;

function toArray(json: unknown): Directory[] {
  return Array.isArray(json) ? json.map(item => new Directory(item)) : [];
}

/** Paths and field names are the backend's (`DirectoryController`, Jackson SNAKE_CASE). */
export class HttpDirectoryService implements DirectoryService {
  constructor(private readonly http: KyInstance) {}

  async get(id: number): Promise<Directory> {
    return new Directory(await this.http.get(`directories/${id}`).json());
  }

  async getRoot(): Promise<Directory> {
    return new Directory(await this.http.get('directories/root').json());
  }

  async getParents(id: number): Promise<DirectoryParents> {
    return new DirectoryParents(await this.http.get(`directories/${id}/parents`).json());
  }

  list(id: number, sorts: readonly DirectorySort[]): Promise<Directory[]> {
    return this.postList(`directories/${id}/list`, sorts);
  }

  listSharedWithMe(id: number, sorts: readonly DirectorySort[]): Promise<Directory[]> {
    return this.postList(`directories/${id}/list/shared`, sorts);
  }

  listRecent(sorts: readonly DirectorySort[]): Promise<Directory[]> {
    return this.postList('directories/recent', sorts);
  }

  listStarred(sorts: readonly DirectorySort[]): Promise<Directory[]> {
    return this.postList('directories/star', sorts);
  }

  listTrash(sorts: readonly DirectorySort[]): Promise<Directory[]> {
    return this.postList('directories/trash', sorts);
  }

  async createFolder(name: string, parentId: number): Promise<Directory> {
    const json = { name, parent_id: parentId, is_removed: false, directory_type: DirectoryType.Directory };
    return new Directory(await this.http.post('directories/create', { json }).json());
  }

  async rename(id: number, name: string): Promise<void> {
    await this.http.put(`directories/${id}/rename`, { json: { to_name: name } });
  }

  async move(id: number, toParentId: number): Promise<void> {
    await this.http.put(`directories/${id}/move`, { json: { to_parent_id: toParentId } });
  }

  async remove(id: number): Promise<void> {
    await this.http.put(`directories/${id}/remove`);
  }

  async deleteForever(id: number): Promise<void> {
    await this.http.delete(`directories/trash/${id}/delete`);
  }

  async restore(id: number): Promise<void> {
    await this.http.put(`directories/${id}/restore`);
  }

  async star(id: number): Promise<void> {
    await this.http.post(`directories/${id}/star`);
  }

  async unstar(id: number): Promise<void> {
    await this.http.post(`directories/${id}/unstar`);
  }

  async setPassword(id: number, hashedPassword: string | undefined): Promise<void> {
    const directory = asRecord(await this.http.get(`directories/${id}`).json());
    const { config: _removed, ...data } = asRecord(directory['data']);
    const config = hashedPassword === undefined ? {} : { config: { enabled: true, hashed_password: hashedPassword } };
    await this.http.put(`directories/${id}`, { json: { ...directory, data: { ...data, ...config } } });
  }

  private async postList(path: string, sorts: readonly DirectorySort[]): Promise<Directory[]> {
    const json = { sorts, from: 0, size: PAGE_SIZE };
    return toArray(await this.http.post(path, { json }).json());
  }
}
