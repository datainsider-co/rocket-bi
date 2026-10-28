import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import { asArray, getPath, asString } from '@/core/json/json';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { ChartViz } from '@/core/query/vizOptions';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { isPivotTableSetting } from '@/core/query/pivotQuery';
import type { SubRowQuery } from '../chart-data/useSubRowQuery';
import { HighchartsChart } from '@/shared/charts/HighchartsChart';
import { titleText } from './highchartsBase';
import { buildKpi } from './kpi/kpi.utils';
import { KpiDateRange, type KpiDateRangeProps } from './kpi/KpiDateRange';
import { KpiView } from './kpi/KpiView';
import { headerColumnOf, tableNumberFormat } from './table/table.utils';
import { tableLookOf } from './table/tableStyle.utils';
import { columnDecorationsOf } from './table/columnDecorations';
import { isCollapseTableSetting } from './table/collapseTable.utils';
import { CollapseTable } from './table/CollapseTable';
import { PivotTable } from './table/PivotTable';
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
}

/** What a number chart shows besides its response. */
export interface KpiParts {
  /** Its trend line values (`useKpiTrend`). */
  trend?: readonly (number | null)[];
  /** Its date range, when it has one. */
  dateRange?: KpiDateRangeProps;
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
 * Picks the renderer for a chart (v1 `ChartComponent`: by viz option class, tables by their response and setting). Charts not
 * ported yet say so instead of failing. Filters go through `FilterRenderer`.
 */
export function ChartRenderer({ widget, viz, response, themeColors, table, crossFilter, kpi }: ChartRendererProps) {
  const { selected, onSelect, onPointMenu } = crossFilter;
  const highchartsOptions = useMemo(() => {
    if (viz.className === ChartVizClass.Series && response.kind === 'series_one') {
      const scalarFunction = asString(getPath(widget.setting, ['x_axis', 'function', 'scalar_function', 'class_name']));
      return buildSeriesChartOptions({ options: viz.options, response, themeColors, timestampXAxis: isTimestampFunction(scalarFunction), onPointClick: onPointMenu });
    }
    if ((viz.className === ChartVizClass.Pie || viz.className === ChartVizClass.Donut) && response.kind === 'series_two') {
      return buildPieChartOptions({ options: viz.options, response, themeColors, selected, onSelect });
    }
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

  if (highchartsOptions) {
    return <HighchartsChart options={highchartsOptions} fill onPointContextMenu={(point, position) => onPointMenu(pointValue(point), position)} />;
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
      loading: table.loading,
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
  return <Unsupported title={titleText(viz.options.title) ?? widget.name} type={viz.className || asString(widget.setting['class_name'])} />;
}
