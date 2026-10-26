import { useMemo } from 'react';
import { getPath, asString } from '@/core/json/json';
import type { Paging } from '@/core/query/QueryRequest';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { ChartViz } from '@/core/query/vizOptions';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { HighchartsChart } from '@/shared/charts/HighchartsChart';
import { DropdownFilterView } from './filter/DropdownFilterView';
import { TabFilterDisplay, filterOptions } from './filter/filter.utils';
import { TabFilterView } from './filter/TabFilterView';
import { titleText } from './highchartsBase';
import { buildKpi } from './kpi/kpi.utils';
import { KpiView } from './kpi/KpiView';
import { buildPieChartOptions } from './pie/pieChartOptions';
import { buildSeriesChartOptions, isTimestampFunction } from './series/seriesChartOptions';
import { FlattenTableView } from './table/FlattenTableView';

/** v1 `ChartOptionClassName` values v2 renders so far. */
export const ChartVizClass = {
  Series: 'highcharts_series_chart_setting',
  Pie: 'highcharts_pie_chart_setting',
  Number: 'number_chart_setting',
  TabFilter: 'tab_filter_chart_setting',
  Dropdown: 'dropdown_filter_chart_setting'
} as const;

export interface ChartRendererProps {
  widget: ChartWidget;
  viz: ChartViz;
  response: VisualizationResponse;
  themeColors: readonly string[];
  paging: Paging;
  isUpdating: boolean;
  onPageChange: (paging: Paging) => void;
  /** The chart's own selection as a control (filters, pie slices); empty means none / All. */
  selected: readonly string[];
  onSelect: (selected: string[]) => void;
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
 * ported yet say so instead of failing.
 */
export function ChartRenderer({ widget, viz, response, themeColors, paging, isUpdating, onPageChange, selected, onSelect }: ChartRendererProps) {
  const highchartsOptions = useMemo(() => {
    if (viz.className === ChartVizClass.Series && response.kind === 'series_one') {
      const scalarFunction = asString(getPath(widget.setting, ['x_axis', 'function', 'scalar_function', 'class_name']));
      return buildSeriesChartOptions({ options: viz.options, response, themeColors, timestampXAxis: isTimestampFunction(scalarFunction) });
    }
    if (viz.className === ChartVizClass.Pie && response.kind === 'series_two') {
      return buildPieChartOptions({ options: viz.options, response, themeColors, selected, onSelect });
    }
    return undefined;
  }, [viz, response, themeColors, widget.setting, selected, onSelect]);

  if (highchartsOptions) return <HighchartsChart options={highchartsOptions} fill />;
  if (viz.className === ChartVizClass.Number && response.kind === 'series_one') return <KpiView kpi={buildKpi(viz.options, response)} />;
  if (viz.className === ChartVizClass.TabFilter && response.kind === 'table') {
    const { displayAs, direction, search } = viz.options as { displayAs?: string; direction?: string; search?: { enabled?: boolean } };
    return (
      <TabFilterView
        title={titleText(viz.options.title)}
        options={filterOptions(response, true)}
        selected={selected}
        displayAs={displayAs ?? TabFilterDisplay.Normal}
        direction={direction === 'column' ? 'column' : 'row'}
        searchEnabled={search?.enabled ?? true}
        onChange={onSelect}
      />
    );
  }
  if (viz.className === ChartVizClass.Dropdown && response.kind === 'table') {
    return <DropdownFilterView title={titleText(viz.options.title)} options={filterOptions(response, false)} selected={selected} onChange={onSelect} />;
  }
  if (response.kind === 'json_table') {
    return (
      <FlattenTableView
        title={titleText(viz.options.title)}
        subtitle={titleText(viz.options.subtitle)}
        response={response}
        paging={paging}
        loading={isUpdating}
        onPageChange={onPageChange}
      />
    );
  }
  return <Unsupported title={titleText(viz.options.title) ?? widget.name} type={viz.className || asString(widget.setting['class_name'])} />;
}
