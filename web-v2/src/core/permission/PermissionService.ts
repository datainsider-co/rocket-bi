import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';

export const Permission = {
  /** Set up and change the organization's data warehouse connection. */
  manageConnection: 'organization:manage:connection'
} as const;

export interface PermissionService {
  /**
   * Asks the server, which resolves wildcards (`0:*:*:*`) that `UserInfo.permissions` only lists. Answers each
   * permission by name; a missing one is not granted.
   */
  isPermitted(username: string, permissions: readonly string[]): Promise<Record<string, boolean>>;
}

export const PermissionService = token<PermissionService>('PermissionService');

export class HttpPermissionService implements PermissionService {
  constructor(private readonly http: KyInstance) {}

  async isPermitted(username: string, permissions: readonly string[]): Promise<Record<string, boolean>> {
    const json = await this.http
      .post(`admin/permissions/${encodeURIComponent(username)}/is_permitted`, { json: { username, permissions } })
      .json();
    // Keys are permission names (data), kept as sent.
    const answers = typeof json === 'object' && json !== null ? Object.entries(json) : [];
    return Object.fromEntries(answers.filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'));
  }
}
