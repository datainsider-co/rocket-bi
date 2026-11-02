import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import type { ResourceAction } from '@/core/permission/ResourcePermissionService';
import { ResourceSharing } from '@/core/share/ResourceSharing';
import type { EtlId } from './EtlJob';

/**
 * Sharing an ETL with users of the organization (v1 `DataCookShareRepository`). ETLs have their own endpoints, like
 * databases: `share/etl/{id}` is a 500, the server has no `etl` resource type there. No link anyone can open. Maps
 * keyed by username or share id are data: sent as they are.
 */
export interface EtlShareService {
  /** The owner and the users the ETL is shared with. `permissions` hold the org (`0:etl:view:<id>`). */
  getSharing(id: EtlId): Promise<ResourceSharing>;
  shareWithUsers(id: EtlId, actionsByUsername: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void>;
  /** The server refuses `edit` for users outside the Editor group (400). */
  editShares(id: EtlId, actionsByShareId: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void>;
  revokeShares(id: EtlId, usernames: readonly string[]): Promise<void>;
}

export const EtlShareService = token<EtlShareService>('EtlShareService');

/** Paths and bodies checked on the local stack (DC0); every change answers `{ <username>: true }`. */
export class HttpEtlShareService implements EtlShareService {
  constructor(private readonly http: KyInstance) {}

  async getSharing(id: EtlId): Promise<ResourceSharing> {
    return new ResourceSharing(await this.http.get(`${sharePath(id)}/list`).json());
  }

  async shareWithUsers(id: EtlId, actionsByUsername: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void> {
    await this.http.post(sharePath(id), { json: { ...body(id), user_actions: actionsByUsername } });
  }

  async editShares(id: EtlId, actionsByShareId: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void> {
    await this.http.put(`${sharePath(id)}/update`, { json: { ...body(id), share_id_actions: actionsByShareId } });
  }

  async revokeShares(id: EtlId, usernames: readonly string[]): Promise<void> {
    await this.http.delete(`${sharePath(id)}/revoke`, { json: { ...body(id), usernames } });
  }
}

function sharePath(id: EtlId): string {
  return `data_cook/${id}/share`;
}

function body(id: EtlId) {
  return { resource_type: 'etl', resource_id: String(id) };
}
