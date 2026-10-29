import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import type { ResourceAction } from '@/core/permission/ResourcePermissionService';
import { ResourceSharing } from '@/core/share/ResourceSharing';

/**
 * Sharing a database with users of the organization (v1 `ShareDatabaseHandler`). Databases have their own endpoints
 * (`SchemaShareController`), not `share/{type}/{id}`, and no link anyone can open. Maps keyed by username or share id
 * are data: sent as they are.
 */
export interface DatabaseShareService {
  /** The owner and the users the database is shared with. `permissions` hold the org (`0:database:view:<db>`). */
  getSharing(dbName: string): Promise<ResourceSharing>;
  shareWithUsers(dbName: string, actionsByUsername: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void>;
  /** The server refuses anything but `view` for users outside the Editor group. */
  editShares(dbName: string, actionsByShareId: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void>;
  revokeShares(dbName: string, usernames: readonly string[]): Promise<void>;
}

export const DatabaseShareService = token<DatabaseShareService>('DatabaseShareService');

/** Paths and bodies checked on the local stack (DW0); every call answers `{ <username>: true }`. */
export class HttpDatabaseShareService implements DatabaseShareService {
  constructor(private readonly http: KyInstance) {}

  async getSharing(dbName: string): Promise<ResourceSharing> {
    return new ResourceSharing(await this.http.get(`${sharePath(dbName)}/list`).json());
  }

  async shareWithUsers(dbName: string, actionsByUsername: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void> {
    await this.http.post(sharePath(dbName), { json: { ...body(dbName), user_actions: actionsByUsername } });
  }

  async editShares(dbName: string, actionsByShareId: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void> {
    await this.http.put(`${sharePath(dbName)}/update`, { json: { ...body(dbName), share_id_actions: actionsByShareId } });
  }

  async revokeShares(dbName: string, usernames: readonly string[]): Promise<void> {
    await this.http.delete(`${sharePath(dbName)}/revoke`, { json: { ...body(dbName), usernames } });
  }
}

function sharePath(dbName: string): string {
  return `databases/${encodeURIComponent(dbName)}/share`;
}

function body(dbName: string) {
  return { resource_type: 'database', resource_id: dbName };
}
