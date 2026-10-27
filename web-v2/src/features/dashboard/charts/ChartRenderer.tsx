import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import { getPath, asString } from '@/core/json/json';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { ChartViz } from '@/core/query/vizOptions';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { HighchartsChart } from '@/shared/charts/HighchartsChart';
import { titleText } from './highchartsBase';
import { buildKpi } from './kpi/kpi.utils';
import { KpiView } from './kpi/KpiView';
import { tableNumberFormat } from './table/table.utils';
import { buildPieChartOptions } from './pie/pieChartOptions';
import { buildSeriesChartOptions, isTimestampFunction } from './series/seriesChartOptions';
import { FlattenTableView } from './table/FlattenTableView';
import { ChartVizClass } from './vizClass';

export interface TablePaging {
  paging: Paging;
  loading: boolean;
  onPageChange: (paging: Paging) => void;
  sort?: TableSort;
  onSortChange: (sort: TableSort | undefined) => void;
}

/** The chart as a control for others (v1 cross filter). */
export interface CrossFilter {
  /** Its own selection, e.g. pie slices; empty means none. */
  selected: readonly string[];
  onSelect: (selected: string[]) => void;
  /** Opens the point menu for a value: a click on a series point, a right click on any point. */
  onPointMenu: (value: string, position: { x: number; y: number }) => void;
}

/** The value a point stands for: a pie slice's name, a series point's category. */
function pointValue(point: Highcharts.Point): string {
  return point.name ?? String(point.category ?? point.x);
}

export interface ChartRendererProps {
  widget: ChartWidget;
  viz: ChartViz;
  response: VisualizationResponse;
  themeColors: readonly string[];
  table: TablePaging;
  crossFilter: CrossFilter;
}

function Unsupported({ title, type }: { title: string; type: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
      <div className="truncate font-medium">{title}</div>
      <div className="text-xs" style={{ color: 'var(--secondary-text-color)' }}>
        {type} is not supported yet
      </div>
    </div>
  );
}

/**
 * Picks the renderer for a chart (v1 `ChartComponent`: by viz option class, tables by their response). Charts not
 * ported yet say so instead of failing. Filters go through `FilterRenderer`.
 */
export function ChartRenderer({ widget, viz, response, themeColors, table, crossFilter }: ChartRendererProps) {
  const { selected, onSelect, onPointMenu } = crossFilter;
  const highchartsOptions = useMemo(() => {
    if (viz.className === ChartVizClass.Series && response.kind === 'series_one') {
      const scalarFunction = asString(getPath(widget.setting, ['x_axis', 'function', 'scalar_function', 'class_name']));
      return buildSeriesChartOptions({ options: viz.options, response, themeColors, timestampXAxis: isTimestampFunction(scalarFunction), onPointClick: onPointMenu });
    }
    if (viz.className === ChartVizClass.Pie && response.kind === 'series_two') {
      return buildPieChartOptions({ options: viz.options, response, themeColors, selected, onSelect });
    }
    return undefined;
  }, [viz, response, themeColors, widget.setting, selected, onSelect, onPointMenu]);
  const tableFormat = useMemo(() => tableNumberFormat(viz.options), [viz.options]);

  if (highchartsOptions) {
    return <HighchartsChart options={highchartsOptions} fill onPointContextMenu={(point, position) => onPointMenu(pointValue(point), position)} />;
  }
  if (viz.className === ChartVizClass.Number && response.kind === 'series_one') return <KpiView kpi={buildKpi(viz.options, response)} />;
  if (response.kind === 'json_table') {
    return (
      <FlattenTableView
        title={titleText(viz.options.title)}
        subtitle={titleText(viz.options.subtitle)}
        response={response}
        paging={table.paging}
        loading={table.loading}
        onPageChange={table.onPageChange}
        sort={table.sort}
        onSortChange={table.onSortChange}
        numberFormat={tableFormat}
      />
    );
  }
  return <Unsupported title={titleText(viz.options.title) ?? widget.name} type={viz.className || asString(widget.setting['class_name'])} />;
}
