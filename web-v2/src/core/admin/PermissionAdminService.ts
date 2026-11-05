import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import type { UserGroup } from './UserGroup';

/** Assigning permissions and groups (v1 `PermissionAdminService`). Reading them is `PermissionService.isPermitted`. */
export interface PermissionAdminService {
  /**
   * Grants `include` and revokes `exclude`; permissions in neither stay as they are. The server refuses the whole
   * request when a Viewer is given a permission without `:view:`.
   */
  changePermissions(username: string, include: readonly string[], exclude: readonly string[]): Promise<void>;
  /** Moves the user to Editor or Viewer. Permissions already granted stay. */
  changeGroup(username: string, group: UserGroup): Promise<void>;
}

export const PermissionAdminService = token<PermissionAdminService>('PermissionAdminService');

export class HttpPermissionAdminService implements PermissionAdminService {
  constructor(private readonly http: KyInstance) {}

  async changePermissions(username: string, include: readonly string[], exclude: readonly string[]): Promise<void> {
    await this.http.put(`admin/permissions/${encodeURIComponent(username)}/change`, {
      json: { username, include_permissions: [...include], exclude_permissions: [...exclude] }
    });
  }

  async changeGroup(username: string, group: UserGroup): Promise<void> {
    await this.http.post(`admin/permissions/${encodeURIComponent(username)}/group`, { json: { user_group: group } });
  }
}
