/*
 * @author: tvc12 - Thien Vi
 * @created: 11/26/20, 6:47 PM
 */

import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import { Paginatable } from '@core/domain/Model/Query/Features/Paginatable';
import { Log } from '@core/utils';
import { FilterRequest } from './FilterRequest';
import { CompareRequest } from './CompareRequest';
import { Comparable } from '@core/domain/Model/Query/Features/Comparable';
import { PivotTableQuerySetting } from '@core/domain/Model/Query/Implement/PivotTableQuerySetting';
import { AbstractTableQuerySetting } from '@core/domain/Model/Query/Implement/AbstractTableQuerySetting';
import { Pagination } from '@/shared/models';

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
    public dashboardId?: number
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
    return new QueryRequest(currentQuerySetting, currentFilterRequests, compareRequest, from, size, useBoost, dashboardId);
  }

  static fromQuery(querySetting: QuerySetting, from: number, size: number, dashboardId?: number): QueryRequest {
    return new QueryRequest(querySetting, [], void 0, from, size, void 0, dashboardId);
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
