import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';

/** What a user may do with a shared resource (v1 `ActionType`). `*` is every action. */
export const ResourceAction = {
  All: '*',
  View: 'view',
  Download: 'download',
  Edit: 'edit',
  Copy: 'copy',
  Delete: 'delete',
  Create: 'create'
} as const;

export type ResourceAction = (typeof ResourceAction)[keyof typeof ResourceAction];

export const ALL_RESOURCE_ACTIONS: readonly ResourceAction[] = Object.values(ResourceAction);

/** v1 `ResourceType`, the path segment of `share/{type}/{id}`. */
export type ResourceType = 'dashboard' | 'queries' | 'directory';

export interface ResourcePermissionService {
  /** The actions the user has on the resource, of those asked (v1 `ShareService.isPermittedForUser`). */
  permittedActions(type: ResourceType, id: number, actions: readonly ResourceAction[]): Promise<ResourceAction[]>;
}

export const ResourcePermissionService = token<ResourcePermissionService>('ResourcePermissionService');

export class HttpResourcePermissionService implements ResourcePermissionService {
  constructor(private readonly http: KyInstance) {}

  async permittedActions(type: ResourceType, id: number, actions: readonly ResourceAction[]): Promise<ResourceAction[]> {
    const json = { resource_type: type, resource_id: String(id), actions };
    const answers: unknown = await this.http.post(`share/${type}/${id}/action_permitted`, { json }).json();
    // Keys are action names, answered true or false.
    return actions.filter(action => typeof answers === 'object' && answers !== null && (answers as Record<string, unknown>)[action] === true);
  }
}
