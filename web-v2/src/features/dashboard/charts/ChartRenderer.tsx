import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import { asArray, getPath, asString } from '@/core/json/json';
import type { DrilldownStep } from '@/core/query/drilldown';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { ChartViz } from '@/core/query/vizOptions';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { isPivotTableSetting } from '@/core/query/pivotQuery';
import type { SubRowQuery } from '../chart-data/useSubRowQuery';
import { ErrorState } from '@/shared/status/ErrorState';
import { HighchartsChart } from '@/shared/charts/HighchartsChart';
import { drillIndexOf, withDrillPath } from './drillPath';
import { titleText } from './highchartsBase';
import './drillPath.css';
import { buildKpi } from './kpi/kpi.utils';
import { KpiDateRange, type KpiDateRangeProps } from './kpi/KpiDateRange';
import { KpiView } from './kpi/KpiView';
import { headerColumnOf, tableNumberFormat } from './table/table.utils';
import { tableLookOf } from './table/tableStyle.utils';
import { columnDecorationsOf } from './table/columnDecorations';
import { isCollapseTableSetting } from './table/collapseTable.utils';
import { CollapseTable } from './table/CollapseTable';
import { PivotTable } from './table/PivotTable';
import { buildFunnelChartOptions, type FunnelType } from './funnel/funnelChartOptions';
import { buildParliamentChartOptions, parliamentLimitError } from './parliament/parliamentChartOptions';
import { buildPieChartOptions } from './pie/pieChartOptions';
import { buildVariablePieChartOptions } from './pie/variablePieChartOptions';
import { buildSeriesChartOptions, isTimestampFunction } from './series/seriesChartOptions';
import { buildStackedChartOptions } from './series/stackedChartOptions';
import { FlattenTableView } from './table/FlattenTableView';
import { ChartVizClass } from './vizClass';

export interface TablePaging {
  paging: Paging;
  onPageChange: (paging: Paging) => void;
  sort?: TableSort;
  onSortChange: (sort: TableSort | undefined) => void;
  /** How a pivot table row loads the rows under it (`useSubRowQuery`). */
  subRows?: SubRowQuery;
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
  kpi?: KpiParts;
  drillPath?: DrillPath;
}

/** Where the viewer drilled down to, drawn in a Highcharts chart's subtitle. */
export interface DrillPath {
  steps: readonly Pick<DrilldownStep, 'value' | 'name'>[];
  /** Back to the chart as it was before step `index`. */
  onBack: (index: number) => void;
}

/** What a number chart shows besides its response. */
export interface KpiParts {
  /** Its trend line values (`useKpiTrend`). */
  trend?: readonly (number | null)[];
  /** Its date range, when it has one. */
  dateRange?: KpiDateRangeProps;
}

const SERIES_CLASSES = new Set<string>([ChartVizClass.Series, ChartVizClass.StackedSeries, ChartVizClass.CircularBar]);

const FUNNEL_TYPES: Readonly<Record<string, FunnelType>> = { [ChartVizClass.Funnel]: 'funnel', [ChartVizClass.Pyramid]: 'pyramid' };

const NO_STEPS: DrillPath['steps'] = [];

/** A parliament with more dots than it allows says so instead of drawing (v1 `InvalidDataException`). */
function chartErrorOf(viz: ChartViz, response: VisualizationResponse): string | undefined {
  return viz.className === ChartVizClass.Parliament && response.kind === 'series_two' ? parliamentLimitError(viz.options, response) : undefined;
}

/**
 * Picks the renderer for a chart (v1 `ChartComponent`: by viz option class, tables by their response and setting). Charts not
 * ported yet say so instead of failing. Filters go through `FilterRenderer`.
 */
export function ChartRenderer({ widget, viz, response, themeColors, table, crossFilter, kpi, drillPath }: ChartRendererProps) {
  const { selected, onSelect, onPointMenu } = crossFilter;
  const highchartsOptions = useMemo(() => {
    if (SERIES_CLASSES.has(viz.className) && response.kind === 'series_one') {
      const scalarFunction = asString(getPath(widget.setting, ['x_axis', 'function', 'scalar_function', 'class_name']));
      const input = { options: viz.options, response, themeColors, timestampXAxis: isTimestampFunction(scalarFunction), onPointClick: onPointMenu };
      return viz.className === ChartVizClass.Series ? buildSeriesChartOptions(input) : buildStackedChartOptions(input);
    }
    if ((viz.className === ChartVizClass.Pie || viz.className === ChartVizClass.Donut) && response.kind === 'series_two') {
      return buildPieChartOptions({ options: viz.options, response, themeColors, selected, onSelect });
    }
    const funnelType = FUNNEL_TYPES[viz.className];
    if (funnelType && response.kind === 'series_two') return buildFunnelChartOptions({ type: funnelType, options: viz.options, response, themeColors });
    if (viz.className === ChartVizClass.Parliament && response.kind === 'series_two' && !chartErrorOf(viz, response)) {
      return buildParliamentChartOptions({ options: viz.options, response, themeColors });
    }
    if (viz.className === ChartVizClass.VariablePie && response.kind === 'generic') return buildVariablePieChartOptions({ options: viz.options, response, themeColors });
    return undefined;
  }, [viz, response, themeColors, widget.setting, selected, onSelect, onPointMenu]);
  const tableFormat = useMemo(() => tableNumberFormat(viz.options), [viz.options]);
  const tableLook = useMemo(() => tableLookOf(viz.options), [viz.options]);
  const minMaxValues = response.kind === 'json_table' ? response.minMaxValues : undefined;
  const decorate = useMemo(
    () => columnDecorationsOf({ options: viz.options, columnOf: headerColumnOf(widget.setting), minMaxValues }),
    [viz.options, widget.setting, minMaxValues]
  );
  const tableColumns = useMemo(() => asArray(widget.setting['columns']), [widget.setting]);

  const steps = drillPath?.steps ?? NO_STEPS;
  const chartOptions = useMemo(() => highchartsOptions && withDrillPath(highchartsOptions, steps), [highchartsOptions, steps]);

  if (chartOptions) {
    const back = (target: EventTarget) => {
      const index = drillIndexOf(target);
      if (index !== undefined) drillPath?.onBack(index);
    };
    return (
      // The drill path is HTML inside the chart's subtitle, so its clicks are caught here.
      <div role="presentation" className="size-full" onClick={event => back(event.target)} onKeyDown={event => event.key === 'Enter' && back(event.target)}>
        <HighchartsChart options={chartOptions} fill onPointContextMenu={(point, position) => onPointMenu(pointValue(point), position)} />
      </div>
    );
  }
  if (viz.className === ChartVizClass.Number && response.kind === 'series_one') {
    const dateRange = kpi?.dateRange && <KpiDateRange {...kpi.dateRange} />;
    return <KpiView kpi={buildKpi(viz.options, response, kpi?.trend)} dateRange={dateRange} />;
  }
  if (response.kind === 'json_table') {
    const tableProps = {
      title: titleText(viz.options.title),
      subtitle: titleText(viz.options.subtitle),
      response,
      paging: table.paging,
      onPageChange: table.onPageChange,
      sort: table.sort,
      onSortChange: table.onSortChange,
      numberFormat: tableFormat,
      look: tableLook,
      decorate
    };
    if (isPivotTableSetting(widget.setting)) return <PivotTable {...tableProps} setting={widget.setting} options={viz.options} subRows={table.subRows} />;
    return isCollapseTableSetting(widget.setting) ? <CollapseTable {...tableProps} columns={tableColumns} /> : <FlattenTableView {...tableProps} />;
  }
  const error = chartErrorOf(viz, response);
  if (error) return <ErrorState message={error} />;
  // v1 `ChartComponent`: a plain line in the card's corner.
  return <div>Chart unsupported</div>;
}
