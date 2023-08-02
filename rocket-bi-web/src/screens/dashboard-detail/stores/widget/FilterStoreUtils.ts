import { FilterRequest, QueryRequest, QuerySetting } from '@core/common/domain';
import { DashboardModule, FilterModule, MainDateCompareRequest, QuerySettingModule } from '@/screens/dashboard-detail/stores';
import { ConditionUtils } from '@core/utils';
import { Pagination } from '@/shared/models';

export class FilterStoreUtils {
  static toMainDateFilterRequest(mainDateCompareRequest: MainDateCompareRequest): FilterRequest | undefined {
    if (mainDateCompareRequest.currentRange && mainDateCompareRequest.mainDateMode) {
      const condition = ConditionUtils.buildMainDateCondition(
        mainDateCompareRequest.field,
        mainDateCompareRequest.currentRange,
        mainDateCompareRequest.mainDateMode
      );
      if (condition) {
        return new FilterRequest(-1, condition);
      } else {
        return void 0;
      }
    } else {
      return void 0;
    }
  }

  /**
   * get chart query request from query setting
   * @param payload {
   *   isFlattenPivot: convert query to flatten pivot if possible
   * }
   */
  static buildQueryRequest(payload: {
    widgetId: number;
    mainDateFilter: FilterRequest | null;
    pagination?: Pagination;
    useBoost?: boolean;
    isFlattenPivot?: boolean;
  }): QueryRequest {
    const { widgetId, pagination, useBoost, mainDateFilter, isFlattenPivot } = payload;
    const filters: FilterRequest[] = FilterModule.getFilters(widgetId);
    const querySetting: QuerySetting = QuerySettingModule.buildQuerySetting(widgetId, isFlattenPivot);

    if (mainDateFilter) {
      filters.push(mainDateFilter);
    }

    return QueryRequest.fromQuerySetting(querySetting, filters, pagination, useBoost, DashboardModule.id);
  }
}
