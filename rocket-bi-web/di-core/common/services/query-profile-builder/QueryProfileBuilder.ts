import { FieldRelatedFunction, FilterWidget, TableQueryChartSetting } from '@core/common/domain/model';
import { FilterRequest, QueryRequest } from '@core/common/domain/request';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';

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
