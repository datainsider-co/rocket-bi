import { useCallback, useMemo, useState } from 'react';
import { Button, Spin } from 'antd';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { DEFAULT_PAGE_SIZE, isPagedSetting, type Paging } from '@/core/query/QueryRequest';
import { applyControlValues, controlsFor } from '@/core/query/controlValues';
import { vizFromSetting } from '@/core/query/vizOptions';
import { selectionOf, selectionToControl } from '../../charts/filter/filter.utils';
import { useDashboardControls } from '../../controls/DashboardControlsContext';
import { ChartRenderer } from '../../charts/ChartRenderer';
import { useWidgetData } from '../../chart-data/useWidgetData';
import { chartTitle } from './chartWidget.utils';

interface ChartWidgetViewProps {
  widget: ChartWidget;
  dashboardId: number;
  themeColors: readonly string[];
}

const FIRST_PAGE: Paging = { from: 0, size: DEFAULT_PAGE_SIZE };

/**
 * v1 `ChartHolder`: queries the chart with the values of the controls it depends on, then loading, error with retry,
 * or the chart (v1 `StatusWidget`). Its own selection (a filter, a clicked pie slice) becomes a control for others.
 */
export function ChartWidgetView({ widget, dashboardId, themeColors }: ChartWidgetViewProps) {
  const [paging, setPaging] = useState<Paging>(FIRST_PAGE);
  const { controls, setControl } = useDashboardControls();
  const paged = isPagedSetting(widget.setting);
  const viz = useMemo(() => vizFromSetting(widget.setting), [widget.setting]);
  const setting = useMemo(() => applyControlValues(widget.setting, controlsFor(widget.setting, widget.id, controls)), [widget, controls]);
  const query = useWidgetData(widget, { dashboardId, setting, paging: paged ? paging : undefined });
  const selected = useMemo(() => selectionOf(controls[widget.id]), [controls, widget.id]);
  const onSelect = useCallback((values: string[]) => setControl(widget.id, selectionToControl(values)), [setControl, widget.id]);

  if (query.isPending) return <Spin className="flex! h-full items-center justify-center" />;
  if (query.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="truncate font-medium">{chartTitle(widget)}</div>
        <div className="line-clamp-3 text-xs" style={{ color: 'var(--secondary-text-color)' }}>
          {query.error.message}
        </div>
        <Button size="small" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  return (
    <ChartRenderer
      widget={widget}
      viz={viz}
      response={query.data}
      themeColors={themeColors}
      paging={paging}
      isUpdating={query.isFetching}
      onPageChange={setPaging}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
