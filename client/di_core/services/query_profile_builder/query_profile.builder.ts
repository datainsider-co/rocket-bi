import { FieldRelatedFunction, FilterWidget, TableQueryChartSetting } from '@core/domain/Model';
import { FilterRequest, QueryRequest } from '@core/domain/Request';
import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';

export abstract class QueryProfileBuilder {
  abstract buildTableQuerySetting(profileFields: FieldDetailInfo[]): TableQueryChartSetting;

  abstract buildQueryForStringData(profileFields: FieldDetailInfo[]): TableQueryChartSetting;

  abstract buildFunction(profileField: FieldDetailInfo): FieldRelatedFunction;

  abstract buildFunctions(profileFields: FieldDetailInfo[]): FieldRelatedFunction[];

  abstract buildFilterRequest(filter: FilterWidget): FilterRequest | undefined;

  abstract buildFilterRequests(filters: FilterWidget[]): FilterRequest[];

  // function get [Min, Max, Avg]
  abstract buildQueryMinMaxAvgRequest(profileField: FieldDetailInfo, dashboardId?: number): QueryRequest;
}
