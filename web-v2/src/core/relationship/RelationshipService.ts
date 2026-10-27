import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { ApiError, ApiErrorReason } from '@/shared/http/ApiError';
import { RelationshipInfo } from './RelationshipInfo';

/**
 * Relationships between the tables a dashboard uses, and the organization's global ones (v1
 * `di-core/data-relationship`). The server needs `relationship:view:{id}` to read and `relationship:create:{id}` to
 * save a dashboard's.
 */
export interface RelationshipService {
  /**
   * The dashboard's saved views and relationships merged with the global ones. A dashboard with nothing saved gets
   * the global views and relationships without positions.
   */
  getDashboardRelationship(dashboardId: number): Promise<RelationshipInfo>;
  saveDashboardRelationship(dashboardId: number, info: RelationshipInfo): Promise<void>;
  getGlobalRelationship(): Promise<RelationshipInfo>;
  saveGlobalRelationship(info: RelationshipInfo): Promise<void>;
}

export const RelationshipService = token<RelationshipService>('RelationshipService');

/** Paths and field names are the backend's (`RelationshipController`, Jackson SNAKE_CASE). */
export class HttpRelationshipService implements RelationshipService {
  constructor(private readonly http: KyInstance) {}

  async getDashboardRelationship(dashboardId: number): Promise<RelationshipInfo> {
    return new RelationshipInfo(await this.http.get(`relationships/${dashboardId}`).json());
  }

  saveDashboardRelationship(dashboardId: number, info: RelationshipInfo): Promise<void> {
    return this.save(`relationships/${dashboardId}`, info);
  }

  async getGlobalRelationship(): Promise<RelationshipInfo> {
    return new RelationshipInfo(await this.http.get('relationships/global').json());
  }

  saveGlobalRelationship(info: RelationshipInfo): Promise<void> {
    return this.save('relationships/global', info);
  }

  private async save(path: string, info: RelationshipInfo): Promise<void> {
    const reply = (await this.http.post(path, { json: info.toJson() }).json()) as { success?: unknown } | null;
    if (reply?.success !== true) {
      throw new ApiError('Cannot save the relationships', 500, ApiErrorReason.unknown);
    }
  }
}
