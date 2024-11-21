/*
 * @author: tvc12 - Thien Vi
 * @created: 11/27/20, 10:30 AM
 */

import { BaseClient } from '@core/common/services/HttpClient';
import { VisualizationResponse } from '@core/common/domain/response';
import { ExportType, QueryRequest } from '@core/common/domain/request';
import { PivotTableQuerySetting, QuerySetting, RawQuerySetting, TableQueryChartSetting, UserProfile } from '@core/common/domain';
import { JsonUtils, Log } from '@core/utils';

export abstract class QueryRepository {
  abstract query(request: QueryRequest): Promise<VisualizationResponse>;

  abstract export(request: QueryRequest, type: ExportType): Promise<Blob>;

  abstract queryWithUser(request: QueryRequest, userProfile: UserProfile): Promise<VisualizationResponse>;
}

export class QueryRepositoryImpl implements QueryRepository {
  constructor(private baseClient: BaseClient) {}

  query(request: QueryRequest): Promise<VisualizationResponse> {
    const jsonParser: ((data: string) => any) | undefined = this.getJsonParser(request.querySetting);
    return this.baseClient.post(`/chart/query`, request, void 0, void 0, jsonParser).then(obj => VisualizationResponse.fromObject(obj));
  }

  queryWithUser(request: QueryRequest, userProfile: UserProfile): Promise<VisualizationResponse> {
    const jsonParser: ((data: string) => any) | undefined = this.getJsonParser(request.querySetting);
    return this.baseClient
      .post(`/chart/view_as`, { queryRequest: request, userProfile: userProfile }, void 0, void 0, jsonParser)
      .then(obj => VisualizationResponse.fromObject(obj));
  }

  /**
   * parse json for table & pivot table
   */
  private getJsonParser(querySetting: QuerySetting): ((data: string) => any) | undefined {
    if (
      PivotTableQuerySetting.isPivotChartSetting(querySetting) ||
      TableQueryChartSetting.isTableChartSetting(querySetting) ||
      RawQuerySetting.isRawQuerySetting(querySetting)
    ) {
      return (data: any) => {
        const records = data.records;
        delete data.records;
        const newData = JsonUtils.fromObject(data);
        return Object.assign(newData, { records: records });
      };
    } else {
      return void 0;
    }
  }

  async export(request: QueryRequest, type: ExportType): Promise<Blob> {
    return this.baseClient.post<Blob>(`/query/${type}`, request, void 0, {}, data => data, void 0, {
      responseType: 'blob'
    });
  }
}
