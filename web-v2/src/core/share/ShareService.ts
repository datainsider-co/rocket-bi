import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import type { ResourceAction, ResourceType } from '@/core/permission/ResourcePermissionService';
import { isApiError } from '@/shared/http/ApiError';
import { PermissionToken, ResourceSharing } from './ResourceSharing';

/** A resource that can be shared: `share/{type}/{id}`. Dashboards are shared through their directory. */
export interface ShareResource {
  type: ResourceType;
  id: number;
}

/**
 * Sharing a resource with users of the organization and with anyone holding a link (v1 `ShareRepository`). Maps whose
 * keys are usernames or share ids are data: sent and read as they are.
 */
export interface ShareService {
  /** The owner and the users it is shared with; v1 asked for the first 100. */
  getSharing(resource: ShareResource, from: number, size: number): Promise<ResourceSharing>;
  /** Shares with new users, actions by username. */
  shareWithUsers(resource: ShareResource, actionsByUsername: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void>;
  /** Changes existing shares, actions by share id. The server refuses this for users outside the Editor group. */
  editShares(resource: ShareResource, actionsByShareId: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void>;
  revokeShares(resource: ShareResource, usernames: readonly string[]): Promise<void>;
  /** The link anyone can open, or `null` when there is none (the server answers 404). */
  getLink(resource: ShareResource): Promise<PermissionToken | null>;
  createLink(resource: ShareResource, actions: readonly ResourceAction[]): Promise<PermissionToken>;
  updateLink(resource: ShareResource, actions: readonly ResourceAction[]): Promise<void>;
  revokeLink(resource: ShareResource): Promise<void>;
}

export const ShareService = token<ShareService>('ShareService');

/** Paths and bodies checked against the local backend; `resource_id` is a string, as v1 sent it. */
export class HttpShareService implements ShareService {
  constructor(private readonly http: KyInstance) {}

  async getSharing({ type, id }: ShareResource, from: number, size: number): Promise<ResourceSharing> {
    return new ResourceSharing(await this.http.get(`share/${type}/${id}`, { searchParams: { from, size } }).json());
  }

  async shareWithUsers(resource: ShareResource, actionsByUsername: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void> {
    await this.http.post(path(resource), { json: { ...body(resource), user_actions: actionsByUsername } });
  }

  async editShares(resource: ShareResource, actionsByShareId: Readonly<Record<string, readonly ResourceAction[]>>): Promise<void> {
    await this.http.put(`${path(resource)}/edit`, { json: { ...body(resource), share_id_actions: actionsByShareId } });
  }

  async revokeShares(resource: ShareResource, usernames: readonly string[]): Promise<void> {
    await this.http.delete(`${path(resource)}/revoke`, { json: { ...body(resource), usernames } });
  }

  async getLink(resource: ShareResource): Promise<PermissionToken | null> {
    try {
      return new PermissionToken(await this.http.get(`${path(resource)}/anyone`).json());
    } catch (error) {
      if (isApiError(error) && error.status === 404) return null;
      throw error;
    }
  }

  async createLink(resource: ShareResource, actions: readonly ResourceAction[]): Promise<PermissionToken> {
    return new PermissionToken(await this.http.post(`${path(resource)}/anyone`, { json: { ...body(resource), actions } }).json());
  }

  async updateLink(resource: ShareResource, actions: readonly ResourceAction[]): Promise<void> {
    await this.http.put(`${path(resource)}/anyone`, { json: { ...body(resource), actions } });
  }

  async revokeLink(resource: ShareResource): Promise<void> {
    await this.http.delete(`${path(resource)}/anyone/revoke`);
  }
}

function path({ type, id }: ShareResource): string {
  return `share/${type}/${id}`;
}

function body({ type, id }: ShareResource) {
  return { resource_type: type, resource_id: String(id) };
}
