import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import type { JsonObject } from '@/core/json/json';
import { visualizationResponseFromJson, type VisualizationResponse } from './VisualizationResponse';

/** v1 `ExportType`. */
export type ExportType = 'csv' | 'xlsx';

export interface QueryService {
  /** `request` is a body built by `toQueryRequestJson`. */
  query(request: JsonObject, signal?: AbortSignal): Promise<VisualizationResponse>;
  /** The request's whole result as a file (`query/{type}`). */
  export(request: JsonObject, type: ExportType): Promise<Blob>;
}

export const QueryService = token<QueryService>('QueryService');

const EXPORT_TIMEOUT = 5 * 60_000;

/** v1 `QueryRepository`. View As (`chart/view_as`) comes with its feature. */
export class HttpQueryService implements QueryService {
  constructor(private readonly http: KyInstance) {}

  async query(request: JsonObject, signal?: AbortSignal): Promise<VisualizationResponse> {
    return visualizationResponseFromJson(await this.http.post('chart/query', { json: request, signal }).json());
  }

  export(request: JsonObject, type: ExportType): Promise<Blob> {
    // The whole result goes into the file, which takes longer than a chart's page.
    return this.http.post(`query/${type}`, { json: request, timeout: EXPORT_TIMEOUT }).blob();
  }
}

export const QueryModule: DiModule = di => {
  di.bindSingleton(QueryService, d => new HttpQueryService(d.get(ApiClient)));
};
