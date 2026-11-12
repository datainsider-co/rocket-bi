import type Highcharts from 'highcharts';
import { escape, merge } from 'lodash-es';
import type { SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, axisLabel, chartColors, titleText } from '../highchartsBase';
import { colorDot, tooltipHtml } from '../pie/pointText';
import { seriesNumberFormat } from '../series/seriesChartOptions';

export type PointChartType = 'scatter' | 'bubble';

const GRID_LINE_COLOR = 'var(--grid-line-color)';

/** v1 `ScatterChartOption.DEFAULT_SETTING` and `BubbleChartOption.DEFAULT_SETTING`, under the stored options. */
const DEFAULTS: Readonly<Record<PointChartType, Highcharts.Options>> = {
  scatter: {
    yAxis: [{ gridLineWidth: 0.5, gridLineColor: GRID_LINE_COLOR, tickLength: 0 }],
    xAxis: [{ gridLineWidth: 0.5, lineWidth: 0.5, gridLineColor: GRID_LINE_COLOR, startOnTick: true, endOnTick: true, showLastLabel: true }]
  },
  bubble: {
    yAxis: [{ gridLineWidth: 0.5, gridLineColor: GRID_LINE_COLOR, tickLength: 0 }],
    xAxis: [{ maxPadding: 0, gridLineWidth: 0, gridLineColor: GRID_LINE_COLOR }],
    plotOptions: { bubble: { marker: { states: { hover: { lineWidth: 0 } } } } }
  }
};

/** The names of the chart's columns, for its tooltip (v1 read them from the query setting). */
export interface PointAxisNames {
  x: string;
  y: string;
  /** What a bubble is sized by. */
  value?: string;
}

const toNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** A point's `[x, y]`, and a bubble's size as `z`. */
export function pointOf(type: PointChartType, row: readonly unknown[]): (number | null)[] {
  return row.slice(0, type === 'bubble' ? 3 : 2).map(toNumber);
}

interface PointOptionsInput {
  type: PointChartType;
  options: VizOptions;
  response: SeriesTwoResponse;
  themeColors: readonly string[];
  names: PointAxisNames;
}

type BubblePoint = Highcharts.Point & { z?: number };

/**
 * Scatter and bubble charts (v1 `ScatterChart`, `BubbleChart`): a series per legend value (one, unnamed, without a
 * legend), each point a pair of numbers and, for a bubble, its size. Both axes are numeric and take their prefix and
 * postfix; the tooltip names each number by its column.
 */
export function buildPointChartOptions({ type, options, response, themeColors, names }: PointOptionsInput): Highcharts.Options {
  const format = seriesNumberFormat(options);
  const axes = (key: 'xAxis' | 'yAxis') => (Array.isArray(options[key]) ? options[key] : []) as unknown[];
  const axisLabels = (key: 'xAxis' | 'yAxis') => ({
    formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
      return axisLabel(format(Number(this.value)), axes(key)[0]);
    }
  });

  const manual: Highcharts.Options = {
    chart: { type, zooming: { type: 'xy' }, ...(type === 'bubble' && { plotBorderWidth: 0.5 }) },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    xAxis: [{ labels: axisLabels('xAxis') }],
    yAxis: [{ labels: axisLabels('yAxis'), ...(type === 'bubble' && { startOnTick: false, endOnTick: false }) }],
    tooltip: {
      useHTML: true,
      outside: true,
      formatter(this: BubblePoint) {
        return tooltipHtml(options, [
          `<span>${colorDot(this.color)}${escape(this.series.name)}</span>`,
          `<span>${escape(names.x)}: <b>${format(Number(this.x))}</b></span>`,
          `<span>${escape(names.y)}: <b>${format(this.y ?? 0)}</b></span>`,
          ...(type === 'bubble' ? [`<span>${escape(names.value ?? '')}: <b>${format(this.z ?? 0)}</b></span>`] : [])
        ]);
      }
    },
    series: response.series.map(item => ({ type, name: item.name, data: item.points.map(row => pointOf(type, row)) }) as Highcharts.SeriesOptionsType)
  };

  return merge({}, BASE_CONFIG, DEFAULTS[type], options, manual) as Highcharts.Options;
}
