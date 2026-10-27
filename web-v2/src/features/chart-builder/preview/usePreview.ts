import { useMemo, useState } from 'react';
import type { JsonObject } from '@/core/json/json';
import { widgetFromJson, type ChartWidget } from '@/core/dashboard/Widget';
import { DEFAULT_PAGE_SIZE, isPagedSetting, type Paging } from '@/core/query/QueryRequest';
import { vizFromSetting } from '@/core/query/vizOptions';
import { useKpiTrend } from '@/features/dashboard/chart-data/useKpiTrend';
import { useWidgetData } from '@/features/dashboard/chart-data/useWidgetData';
import { buildChartQuery, isAffectedByFilter } from '@/features/dashboard/controls/chartQuery.utils';
import { defaultControlValues, type ControlEntry } from '@/features/dashboard/controls/controls.utils';
import { useDashboardControls } from '@/features/dashboard/controls/DashboardControlsContext';

const FIRST_PAGE: Paging = { from: 0, size: DEFAULT_PAGE_SIZE };

/** Stands in while the zones are not filled; never queried. */
const NOTHING: ChartWidget = { kind: 'chart', id: -1, name: '', description: '', json: {}, setting: {} };

function chartOf(json: JsonObject | undefined): ChartWidget | undefined {
  const widget = json && widgetFromJson(json);
  return widget?.kind === 'chart' ? widget : undefined;
}

/**
 * The chart being built, queried like on the dashboard with its current controls and header filters (v1 `VizPanel`,
 * `buildChartQuery`). A filter keeps its own selection here, apart from the dashboard's, starting from its default
 * value. A new setting shows its first page.
 */
export function usePreview(json: JsonObject | undefined, dashboardId: number) {
  const chart = useMemo(() => chartOf(json), [json]);
  const widget = chart ?? NOTHING;
  const { controls, widgets, headerRequests } = useDashboardControls();
  const query = useMemo(
    () => buildChartQuery(widget, controls, widgets, isAffectedByFilter(widget.setting) ? headerRequests : []),
    [widget, controls, widgets, headerRequests]
  );
  const [page, setPage] = useState({ setting: widget.setting, paging: FIRST_PAGE });
  const paging = page.setting === widget.setting ? page.paging : FIRST_PAGE;
  const data = useWidgetData(widget, { dashboardId, query, paging: isPagedSetting(widget.setting) ? paging : undefined, enabled: chart !== undefined });
  const trend = useKpiTrend(widget, query, dashboardId);
  const viz = useMemo(() => vizFromSetting(widget.setting), [widget.setting]);
  const [entry, setEntry] = useState<ControlEntry>();
  const [now] = useState(() => new Date());
  const defaultEntry = useMemo(() => chart && defaultControlValues(chart, now), [chart, now]);

  return {
    chart,
    viz,
    query,
    data,
    trend,
    table: { paging, loading: data.isFetching, onPageChange: (next: Paging) => setPage({ setting: widget.setting, paging: next }), onSortChange: () => {} },
    filter: { entry: entry ?? defaultEntry, onChange: setEntry },
    /** v1 kept Add disabled while the preview failed. */
    failed: data.isError
  };
}

export type PreviewState = ReturnType<typeof usePreview>;
