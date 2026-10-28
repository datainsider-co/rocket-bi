import { Button, Spin } from 'antd';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { ChartRenderer } from '../../charts/ChartRenderer';
import { FilterRenderer, isFilterViz } from '../../charts/filter/FilterRenderer';
import { chartTitle } from './chartWidget.utils';
import { DrillPathView } from './DrillPathView';
import { PointMenuView } from './PointMenuView';
import type { ChartWidgetState } from './useChartWidget';

interface ChartWidgetViewProps {
  widget: ChartWidget;
  dashboardId: number;
  themeColors: readonly string[];
  chart: ChartWidgetState;
}

/** v1 `ChartHolder` body: loading, error with retry, then the chart or the filter (v1 `StatusWidget`). */
export function ChartWidgetView({ widget, dashboardId, themeColors, chart }: ChartWidgetViewProps) {
  const { data } = chart;

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
    <div className="flex h-full flex-col">
      <DrillPathView steps={chart.drillPath.steps} onBack={chart.drillPath.onBack} />
      <div className="min-h-0 flex-1">
        <ChartRenderer widget={widget} viz={chart.viz} response={data.data} themeColors={themeColors} table={chart.table} crossFilter={chart.crossFilter} kpi={chart.kpi} />
      </div>
      <PointMenuView {...chart.pointMenu} />
    </div>
  );
}
