import type Highcharts from 'highcharts';
import type { SeriesItem } from '@/core/query/VisualizationResponse';
import { vizKey, type VizOptions } from '@/core/query/vizOptions';
import { buildSeriesChartOptions, formatDateTime, perSeriesOptionsOf, seriesData, seriesNumberFormat, type SeriesOptionsInput } from './seriesChartOptions';

/** v1's stack for a series without a group of its own or from the server: all of them stack together. */
export const DEFAULT_STACK = 'unGroup';

/** v1 `ChartOption.CHART_TYPE_CONVERT` for the types a stacked series may be given. */
const HIGHCHARTS_TYPES: Readonly<Record<string, string>> = { area: 'areaspline', stack_line: 'line', stack_column: 'column', stack_bar: 'bar' };

/**
 * The stack a series goes into (v1 `StackingSeriesChart.load`): the group picked in the Stack tab, else the server's
 * (with a breakdown, a legend value's breakdown values share the legend value's stack; with only a legend, each legend
 * value is its own stack, so they stand side by side), else the shared one.
 */
export function stackOf(options: VizOptions, item: SeriesItem): string {
  const picked = (options['stackingGroup'] as Record<string, unknown> | undefined)?.[vizKey(item.name)];
  if (typeof picked === 'string' && picked !== '') return picked;
  return item.stack ?? DEFAULT_STACK;
}

function stackedSeries({ options, response, timestampXAxis }: SeriesOptionsInput): Highcharts.SeriesOptionsType[] {
  const perSeries = perSeriesOptionsOf(options);
  return response.series.map(item => {
    const key = vizKey(item.name);
    const ownType = options.typesByLabel?.[key];
    return {
      name: item.name,
      data: seriesData(item, response, timestampXAxis),
      ...(item.yAxis !== undefined && { yAxis: item.yAxis }),
      ...perSeries[key],
      // v1 drew a series with the chart's type unless one was set by label.
      type: ownType === undefined ? (options.chart?.type ?? 'column') : (HIGHCHARTS_TYPES[ownType] ?? ownType),
      stack: stackOf(options, item)
    } as Highcharts.SeriesOptionsType;
  });
}

/**
 * Stacked column and bar, and the circular bar (v1 `StackingSeriesChart`): the series chart, with each series in its
 * stack and one tooltip for every series of a category.
 */
export function buildStackedChartOptions(input: SeriesOptionsInput): Highcharts.Options {
  const base = buildSeriesChartOptions(input);
  const format = seriesNumberFormat(input.options);
  const tooltipStyle = (input.options.tooltip?.style ?? {}) as { color?: string; fontFamily?: string };
  const { timestampXAxis } = input;
  return {
    ...base,
    tooltip: {
      ...base.tooltip,
      shared: true,
      formatter(this: Highcharts.Point & { points?: Highcharts.Point[] }) {
        const x = timestampXAxis ? formatDateTime(Number(this.x)) : (this.category ?? this.x);
        const rows = (this.points ?? [this])
          .map(point => `<span style="color:${String(point.color)}; padding-right: 5px;">●</span>${point.series.name}: <b>${format(point.y ?? 0)}</b>`)
          .join('<br/>');
        return `<div style="text-align: left; color: ${tooltipStyle.color ?? 'var(--text-color)'}; font-family: ${tooltipStyle.fontFamily ?? 'var(--widget-secondary-font-family, Roboto)'}">
            <span>${String(x)}</span><br/>${rows}
          </div>`;
      }
    },
    series: stackedSeries(input)
  };
}
