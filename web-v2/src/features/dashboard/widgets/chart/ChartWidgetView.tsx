import type { ChartWidget } from '@/core/dashboard/Widget';
import { canQuerySetting } from '@/core/query/QueryRequest';
import { responseHasData } from '@/core/query/VisualizationResponse';
import { EmptyData } from '@/shared/status/EmptyData';
import { ErrorState } from '@/shared/status/ErrorState';
import { Loading } from '@/shared/status/Loading';
import { ChartRenderer } from '../../charts/ChartRenderer';
import { FilterRenderer, isFilterViz } from '../../charts/filter/FilterRenderer';
import { Popover } from 'antd';
import { DrillPanel } from './DrillPanel';
import { PointAnchor } from './PointAnchor';
import { PointMenuView } from './PointMenuView';
import type { ChartWidgetState } from './useChartWidget';

interface ChartWidgetViewProps {
  widget: ChartWidget;
  dashboardId: number;
  themeColors: readonly string[];
  chart: ChartWidgetState;
}

/**
 * v1 `ChartHolder` body in its `StatusWidget`: loading, error with Try Again, the empty icon for a queried chart
 * without data, then the chart or the filter, under a veil while its next data loads.
 */
export function ChartWidgetView({ widget, dashboardId, themeColors, chart }: ChartWidgetViewProps) {
  const { data } = chart;

  if (data.isPending) return <Loading />;
  if (data.isError) return <ErrorState message={data.error.message} onRetry={() => void data.refetch()} />;
  return (
    <div className="chart-status">
      {content()}
      {data.isFetching && (
        <div className="chart-status__updating">
          <Loading />
        </div>
      )}
    </div>
  );

  function content() {
    if (!data.data) return null;
    // v1 passed no message here, so the icon stands alone.
    if (canQuerySetting(chart.query.setting) && !responseHasData(data.data)) return <EmptyData>{null}</EmptyData>;
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
        <ChartRenderer widget={widget} viz={chart.viz} response={data.data} themeColors={themeColors} table={chart.table} crossFilter={chart.crossFilter} kpi={chart.kpi} drillPath={chart.drillPath} />
        <PointMenuView {...chart.pointMenu} />
        {chart.drill.panel && (
          // v1 `DrilldownSettingContextMenu`: the panel where the menu was, closed by a click outside it.
          <PointAnchor position={chart.drill.panel.position}>
            {anchor => (
              <Popover
                open
                placement="bottomLeft"
                classNames={{ root: 'drill-panel-popover' }}
                onOpenChange={open => !open && chart.drill.closePanel()}
                content={<DrillPanel drill={chart.drill} initialValue={chart.drill.panel?.value} onClose={chart.drill.closePanel} />}
              >
                {anchor}
              </Popover>
            )}
          </PointAnchor>
        )}
      </>
    );
  }
}
