import type { KyInstance } from 'ky';
import Deneric from 'deneric2';
import { token } from '@/core/di/Container';
import { DirectoryType } from '@/core/directory/Directory';
import { asArray, asNumber, asRecord, type JsonObject } from '@/core/json/json';
import { dashboardFromJson, type Dashboard } from './Dashboard';
import { positionsToJson, type PositionMap } from './Position';

/**
 * What the directory screens need of a dashboard. The full model is `Dashboard`.
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

/** A page of `dashboards/list_drill_through`. */
export interface DrillThroughPage {
  total: number;
  dashboards: DashboardSummary[];
}

export interface DrillThroughRequest {
  /** Backend fields; a dashboard is listed when one of its filter widgets is on one of them. */
  fields: readonly JsonObject[];
  /** The current dashboard. */
  excludeIds: readonly number[];
  from: number;
  size: number;
}

export interface DashboardService {
  get(id: number): Promise<Dashboard>;
  /**
   * Creates an empty dashboard. v1 also sent a default `setting`; the server accepts none and v1 falls back to the
   * default setting when it reads one without it.
   */
  create(name: string, parentDirectoryId: number): Promise<DashboardSummary>;
  rename(id: number, name: string): Promise<void>;
  /**
   * Saves widget positions. The server rejects the request unless `positions` has exactly one entry per widget of
   * the dashboard, including widgets inside tabs and filter panels, so always send the whole map. It stores
   * unplaced positions (-1) as they are: place them first.
   */
  resizeWidgets(dashboardId: number, positions: PositionMap): Promise<void>;
  /** Dashboards to drill through to, by name, those the user can see only. */
  listDrillThrough(request: DrillThroughRequest, signal?: AbortSignal): Promise<DrillThroughPage>;
}

export const DashboardService = token<DashboardService>('DashboardService');

/** Paths and field names are the backend's (`DashboardController`, Jackson SNAKE_CASE). */
export class HttpDashboardService implements DashboardService {
  constructor(private readonly http: KyInstance) {}

  async get(id: number): Promise<Dashboard> {
    return dashboardFromJson(await this.http.get(`dashboards/${id}`).json());
  }

  async create(name: string, parentDirectoryId: number): Promise<DashboardSummary> {
    const json = { name, parent_directory_id: parentDirectoryId, directory_type: DirectoryType.Dashboard };
    return new DashboardSummary(await this.http.post('dashboards/create', { json }).json());
  }

  async rename(id: number, name: string): Promise<void> {
    await this.http.put(`dashboards/${id}/rename`, { json: { to_name: name } });
  }

  async resizeWidgets(dashboardId: number, positions: PositionMap): Promise<void> {
    await this.http.put(`dashboards/${dashboardId}/widgets/resize`, { json: { positions: positionsToJson(positions) } });
  }

  async listDrillThrough({ fields, excludeIds, from, size }: DrillThroughRequest, signal?: AbortSignal): Promise<DrillThroughPage> {
    const json = { fields, exclude_ids: excludeIds, from, size, is_removed: false };
    const page = asRecord(await this.http.post('dashboards/list_drill_through', { json, signal }).json());
    // Each item is a whole dashboard, widgets included; the listing needs its id and name.
    return { total: asNumber(page['total']), dashboards: asArray(page['data']).map(item => new DashboardSummary(item)) };
  }
}
