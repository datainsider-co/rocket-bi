import { useMemo } from 'react';
import { hasLazyPivotRows, pivotSubRowSetting } from '@/core/query/pivotQuery';
import { toQueryRequestJson, type Paging } from '@/core/query/QueryRequest';
import type { ChartQuery } from '../controls/chartQuery.utils';
import { useChartDataQuery, type ChartDataQuery } from './useWidgetData';

const ALL_ROWS: Paging = { from: -1, size: -1 };

/** The query of the rows under a pivot table row, by the row's path; `undefined` past the last row group. */
export type SubRowQuery = (path: readonly string[]) => ChartDataQuery | undefined;

/**
 * How a pivot table with columns across loads the rows under a row (v1 `DashboardControllerStore.loadSubRows`): the
 * chart's query for the next row group, filtered by the row's values, with the same filter requests and parameters, all
 * rows at once. `undefined` for charts whose rows don't load that way.
 */
export function useSubRowQuery(widgetId: number, query: ChartQuery, dashboardId: number): SubRowQuery | undefined {
  const queryOf = useChartDataQuery(dashboardId);
  return useMemo(() => {
    if (!hasLazyPivotRows(query.setting)) return undefined;
    return path => {
      const setting = pivotSubRowSetting(query.setting, path);
      if (!setting) return undefined;
      const request = toQueryRequestJson({ setting, filterRequests: query.filterRequests, parameters: query.parameters, paging: ALL_ROWS, dashboardId, chartId: widgetId });
      return queryOf(widgetId, request);
    };
  }, [query.setting, query.filterRequests, query.parameters, dashboardId, widgetId, queryOf]);
}
