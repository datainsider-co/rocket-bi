import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useDi } from '@/app/di/DiContext';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { toQueryRequestJson, type Paging } from '@/core/query/QueryRequest';
import { QueryService } from '@/core/query/QueryService';
import { dashboardKeys } from '../detail/dashboardQueries';
import { createConcurrencyLimit } from './concurrencyLimit';

const MAX_CONCURRENT_QUERIES = 7;
const limit = createConcurrencyLimit(MAX_CONCURRENT_QUERIES);

export const chartDataKeys = {
  all: (dashboardId: number) => [...dashboardKeys.detail(dashboardId), 'chart-data'] as const,
  /** The request itself is the key: a new filter or page is a new request, so a new entry. */
  request: (dashboardId: number, widgetId: number, request: unknown) =>
    [...chartDataKeys.all(dashboardId), widgetId, request] as const
};

interface WidgetDataOptions {
  dashboardId: number;
  paging?: Paging;
}

/**
 * The data of one chart widget (v1 `DashboardControllerStore.renderChart` + `ChartDataStore`). While a new request
 * loads, the previous data stays on screen (v1's "updating" state): `isFetching` with `data`.
 */
export function useWidgetData(widget: ChartWidget, { dashboardId, paging }: WidgetDataOptions) {
  const service = useDi(QueryService);
  const request = useMemo(
    () => toQueryRequestJson({ setting: widget.setting, paging, dashboardId, chartId: widget.id }),
    [widget.setting, widget.id, paging, dashboardId]
  );
  return useQuery({
    queryKey: chartDataKeys.request(dashboardId, widget.id, request),
    queryFn: ({ signal }) => limit(() => service.query(request, signal)),
    placeholderData: keepPreviousData
  });
}
