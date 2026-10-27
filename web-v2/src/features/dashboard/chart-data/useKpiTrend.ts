import { useMemo } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { trendLineSettingOf } from '@/core/query/comparison';
import type { ChartQuery } from '../controls/chartQuery.utils';
import { useWidgetData } from './useWidgetData';

/**
 * The values of a number chart's trend line (v1 `TrendLineChart`): its own series query, with the chart's filter
 * requests, run while the chart has a trend line. v1 sent it without any filter.
 */
export function useKpiTrend(widget: ChartWidget, query: ChartQuery, dashboardId: number): readonly (number | null)[] | undefined {
  const setting = useMemo(() => trendLineSettingOf(query.setting), [query.setting]);
  const trendWidget = useMemo<ChartWidget>(() => ({ ...widget, setting: setting ?? {} }), [widget, setting]);
  const trendQuery = useMemo(() => setting && { setting, filterRequests: query.filterRequests, parameters: query.parameters }, [setting, query.filterRequests, query.parameters]);
  const { data } = useWidgetData(trendWidget, { dashboardId, query: trendQuery, enabled: setting !== undefined });
  return setting && data?.kind === 'series_one' ? (data.series[0]?.data ?? []) : undefined;
}
