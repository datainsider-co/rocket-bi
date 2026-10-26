import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import type { JsonObject } from '@/core/json/json';
import { visualizationResponseFromJson, type VisualizationResponse } from './VisualizationResponse';

export interface QueryService {
  /** `request` is a body built by `toQueryRequestJson`. */
  query(request: JsonObject, signal?: AbortSignal): Promise<VisualizationResponse>;
}

export const QueryService = token<QueryService>('QueryService');

/** v1 `QueryRepository`. View As (`chart/view_as`) and export (`query/{type}`) come with their features. */
export class HttpQueryService implements QueryService {
  constructor(private readonly http: KyInstance) {}

  async query(request: JsonObject, signal?: AbortSignal): Promise<VisualizationResponse> {
    return visualizationResponseFromJson(await this.http.post('chart/query', { json: request, signal }).json());
  }
}

export const QueryModule: DiModule = di => {
  di.bindSingleton(QueryService, d => new HttpQueryService(d.get(ApiClient)));
};
