import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useDi } from '@/app/di/DiContext';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { canQuerySetting, toQueryRequestJson, type Paging } from '@/core/query/QueryRequest';
import { QueryService } from '@/core/query/QueryService';
import type { TableResponse } from '@/core/query/VisualizationResponse';
import type { ChartQuery } from '../controls/chartQuery.utils';
import { dashboardKeys } from '../detail/dashboardQueries';
import { useViewAsUser } from '../view-as/ViewAsContext';
import { createConcurrencyLimit } from './concurrencyLimit';

const MAX_CONCURRENT_QUERIES = 7;
const limit = createConcurrencyLimit(MAX_CONCURRENT_QUERIES);

/** What a chart the server can't query renders with (v1 `TableResponse.empty()`). */
export const EMPTY_TABLE: TableResponse = { kind: 'table', headers: [], records: [], total: 0 };

export const chartDataKeys = {
  all: (dashboardId: number) => [...dashboardKeys.detail(dashboardId), 'chart-data'] as const,
  /** The request itself is the key: a new filter or page is a new request, so a new entry. So is another View As user. */
  request: (dashboardId: number, widgetId: number, request: unknown, viewAs?: string) =>
    [...chartDataKeys.all(dashboardId), widgetId, request, viewAs ?? null] as const
};

interface WidgetDataOptions {
  dashboardId: number;
  /** The widget's query with the dashboard's controls applied (`buildChartQuery`); the stored setting by default. */
  query?: ChartQuery;
  paging?: Paging;
  /** False while there is nothing to query yet (ChartBuilder's preview before its zones are filled). */
  enabled?: boolean;
}

/**
 * The data of one chart widget (v1 `DashboardControllerStore.renderChart` + `ChartDataStore`). While a new request
 * loads, the previous data stays on screen (v1's "updating" state): `isFetching` with `data`. A chart the server can't
 * query (an input, a tab control) gets an empty table without a request. Under View As it is queried as that user.
 */
export function useWidgetData(widget: ChartWidget, { dashboardId, query, paging, enabled = true }: WidgetDataOptions) {
  const service = useDi(QueryService);
  const viewAs = useViewAsUser();
  const setting = query?.setting ?? widget.setting;
  const queryable = canQuerySetting(setting);
  const request = useMemo(
    () =>
      toQueryRequestJson({
        setting,
        filterRequests: query?.filterRequests,
        parameters: query?.parameters,
        paging,
        dashboardId,
        chartId: widget.id,
        compareRequest: query?.compareRequest
      }),
    [setting, query?.filterRequests, query?.parameters, query?.compareRequest, widget.id, paging, dashboardId]
  );
  return useQuery({
    queryKey: chartDataKeys.request(dashboardId, widget.id, request, viewAs?.profile.username),
    queryFn: ({ signal }) => {
      if (!queryable) return Promise.resolve(EMPTY_TABLE);
      return limit(() => (viewAs ? service.queryAs(request, viewAs.json, signal) : service.query(request, signal)));
    },
    placeholderData: keepPreviousData,
    enabled
  });
}
