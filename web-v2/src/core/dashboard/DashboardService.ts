import type { KyInstance } from 'ky';
import Deneric from 'deneric2';
import { token } from '@/core/di/Container';
import { DirectoryType } from '@/core/directory/Directory';

/**
 * What the directory screens need of a dashboard. The full model (widgets, positions, setting) comes with the
 * dashboard viewer.
 */
export class DashboardSummary extends Deneric {
  id = 0;
  name = '';
  ownerId = '';

  constructor(json?: unknown) {
    super({
      id: ['id', Number],
      name: ['name', String],
      ownerId: ['owner_id', String]
    });
    this.fromJson(json);
  }
}

export interface DashboardService {
  /**
   * Creates an empty dashboard. v1 also sent a default `setting`; the server accepts none and v1 falls back to the
   * default setting when it reads one without it.
   */
  create(name: string, parentDirectoryId: number): Promise<DashboardSummary>;
  rename(id: number, name: string): Promise<void>;
}

export const DashboardService = token<DashboardService>('DashboardService');

/** Paths and field names are the backend's (`DashboardController`, Jackson SNAKE_CASE). */
export class HttpDashboardService implements DashboardService {
  constructor(private readonly http: KyInstance) {}

  async create(name: string, parentDirectoryId: number): Promise<DashboardSummary> {
    const json = { name, parent_directory_id: parentDirectoryId, directory_type: DirectoryType.Dashboard };
    return new DashboardSummary(await this.http.post('dashboards/create', { json }).json());
  }

  async rename(id: number, name: string): Promise<void> {
    await this.http.put(`dashboards/${id}/rename`, { json: { to_name: name } });
  }
}
