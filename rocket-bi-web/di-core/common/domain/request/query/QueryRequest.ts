/*
 * @author: tvc12 - Thien Vi
 * @created: 11/26/20, 6:47 PM
 */

import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { Paginatable } from '@core/common/domain/model/query/features/Paginatable';
import { Log, ObjectUtils } from '@core/utils';
import { FilterRequest } from './FilterRequest';
import { CompareRequest } from './CompareRequest';
import { Comparable } from '@core/common/domain/model/query/features/Comparable';
import { PivotTableQuerySetting } from '@core/common/domain/model/query/implement/PivotTableQuerySetting';
import { AbstractTableQuerySetting } from '@core/common/domain/model/query/implement/AbstractTableQuerySetting';
import { Pagination } from '@/shared/models';
import { QueryParameter } from '@core/common/domain';
import { MapUtils } from '@/utils';

export class QueryRequest {
  constructor(
    public querySetting: QuerySetting,
    public filterRequests: FilterRequest[] = [],
    public compareRequest?: CompareRequest,
    /**
     * @min from -1
     */
    public from: number = -1,
    /**
     * @min from -1
     */
    public size: number = -1,
    public useBoost?: boolean,
    // apply for relationship
    public dashboardId?: number,
    public parameters: Map<string, string> = new Map<string, string>()
  ) {}

  static buildQueryRequest(
    querySetting: QuerySetting,
    filterRequests?: FilterRequest[],
    pagination?: Pagination,
    useBoost?: boolean,
    dashboardId?: number
  ): QueryRequest {
    let currentQuerySetting = querySetting;
    let from = -1;
    let size = -1;
    let compareRequest: CompareRequest | undefined = void 0;
    const currentFilterRequests = filterRequests ?? [];

    if (Paginatable.isPaginatable(querySetting)) {
      from = querySetting.getFrom();
      size = querySetting.getSize();
    }

    if (pagination) {
      from = pagination.from;
      size = pagination.size;
    }

    if (Comparable.isComparable(querySetting)) {
      currentFilterRequests.push(...querySetting.getDateFilterRequests());
      compareRequest = querySetting.getCompareRequest();
    }

    if (PivotTableQuerySetting.isPivotChartSetting(querySetting)) {
      currentQuerySetting = querySetting.getCurrentQuery();
    }
    const queryParam: Record<string, any> = ObjectUtils.isNotEmpty(querySetting.parameters) ? querySetting.parameters : querySetting.getQueryParamInOptions();
    Log.debug('buildQueryRequest::', queryParam, querySetting.parameters);
    const newQueryParams: Map<string, string> = MapUtils.fromRecord<string, string>(queryParam);
    return new QueryRequest(currentQuerySetting, currentFilterRequests, compareRequest, from, size, useBoost, dashboardId, newQueryParams);
  }

  static fromQuery(querySetting: QuerySetting, from: number, size: number, dashboardId?: number): QueryRequest {
    const queryParam: Record<string, any> = ObjectUtils.isNotEmpty(querySetting.parameters) ? querySetting.parameters : querySetting.getQueryParamInOptions();
    const newQueryParams: Map<string, string> = MapUtils.fromRecord<string, string>(queryParam);
    return new QueryRequest(querySetting, [], void 0, from, size, void 0, dashboardId, newQueryParams);
  }

  handleSetDefaultPagination(): void {
    if (Paginatable.isPaginatable(this.querySetting)) {
      this.from = this.querySetting.getFrom();
      this.size = this.querySetting.getSize();
    } else {
      this.from = -1;
      this.size = -1;
    }
  }

  setPaging(from: number, size: number) {
    this.from = from;
    this.size = size;
  }
}

export class TrackingProfileSearchRequest {
  constructor(
    public querySetting: AbstractTableQuerySetting,
    public filterRequests: FilterRequest[] = [],
    public from: number = -1,
    public size: number = -1
  ) {}
}
