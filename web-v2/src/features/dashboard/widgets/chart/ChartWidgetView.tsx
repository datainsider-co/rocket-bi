import { Button, Spin } from 'antd';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { ChartRenderer } from '../../charts/ChartRenderer';
import { FilterRenderer, isFilterViz } from '../../charts/filter/FilterRenderer';
import { chartTitle } from './chartWidget.utils';
import { PointMenuView } from './PointMenuView';
import { useChartWidget } from './useChartWidget';

interface ChartWidgetViewProps {
  widget: ChartWidget;
  dashboardId: number;
  themeColors: readonly string[];
}

/** v1 `ChartHolder`: loading, error with retry, then the chart or the filter (v1 `StatusWidget`). */
export function ChartWidgetView({ widget, dashboardId, themeColors }: ChartWidgetViewProps) {
  const chart = useChartWidget(widget, dashboardId);
  const { data, pointActions } = chart;

  if (data.isPending) return <Spin className="flex! h-full items-center justify-center" />;
  if (data.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="truncate font-medium">{chartTitle(widget)}</div>
        <div className="line-clamp-3 text-xs" style={{ color: 'var(--secondary-text-color)' }}>
          {data.error.message}
        </div>
        <Button size="small" onClick={() => void data.refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  if (isFilterViz(chart.viz)) {
    return (
      <FilterRenderer
        widget={widget}
        viz={chart.viz}
        response={data.data}
        query={chart.query}
        dashboardId={dashboardId}
        entry={chart.entry}
        onChange={chart.setEntry}
      />
    );
  }
  return (
    <>
      <ChartRenderer widget={widget} viz={chart.viz} response={data.data} themeColors={themeColors} table={chart.table} crossFilter={chart.crossFilter} />
      <PointMenuView
        position={pointActions.menu?.position}
        value={pointActions.menu?.value ?? ''}
        canReset={pointActions.canReset}
        onUseAsFilter={pointActions.useAsFilter}
        onReset={pointActions.reset}
        onClose={pointActions.close}
      />
    </>
  );
}
