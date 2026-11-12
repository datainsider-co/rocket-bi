import type Highcharts from 'highcharts';
import { escape, merge } from 'lodash-es';
import type { GenericResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, HTML_LABEL_FONT_SIZE, axisLabel, chartColors, labelFontSize, titleText } from '../highchartsBase';
import { colorDot, tooltipHtml } from '../pie/pointText';
import { SERIES_DEFAULTS, seriesNumberFormat } from '../series/seriesChartOptions';

/** The Highcharts series types v1 `GenericChart` draws from a generic response (`chart.type` of the stored options). */
const RANGE_TYPES = new Set(['arearange', 'columnrange']);

/** Whether the stored options are an Area Range's or a Column Range's. */
export function isRangeChart(options: VizOptions): boolean {
  return RANGE_TYPES.has(String(options.chart?.type));
}

const toNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

type RangePoint = Highcharts.Point & { low?: number; high?: number };

interface RangeOptionsInput {
  options: VizOptions;
  response: GenericResponse;
  themeColors: readonly string[];
}

/**
 * Area Range and Column Range charts (v1 `GenericChart`): each record is an X-Axis value, its minimum and its maximum,
 * drawn as one series named after the X-Axis column. Both name their categories and say "low - high" in the tooltip;
 * v1 did so for the columns only, leaving the area with row numbers and an empty value.
 */
export function buildRangeChartOptions({ options, response, themeColors }: RangeOptionsInput): Highcharts.Options {
  const type = options.chart?.type === 'columnrange' ? 'columnrange' : 'arearange';
  const format = seriesNumberFormat(options);
  const yAxis = (Array.isArray(options.yAxis) ? options.yAxis : []) as unknown[];
  const dataLabels = ((options.plotOptions?.series as Record<string, unknown> | undefined)?.['dataLabels'] ?? {}) as { style?: { color?: string } };
  const labelColor = dataLabels.style?.color ?? '#fff';
  const xAxisName = response.headers[0] ?? '';

  const manual: Highcharts.Options = {
    chart: { type },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    xAxis: [{ type: 'category', categories: response.records.map(([name]) => String(name ?? '')) }],
    yAxis: [0, 1].map(index => ({
      labels: {
        formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
          return axisLabel(format(Number(this.value)), yAxis[index]);
        }
      }
    })),
    plotOptions: {
      series: {
        dataLabels: {
          useHTML: true,
          style: { fontSize: labelFontSize(dataLabels.style, HTML_LABEL_FONT_SIZE.dataLabel) },
          // Called once for the low end and once for the high one, each as `y`.
          formatter(this: Highcharts.Point) {
            return `<div style="color: ${labelColor}">${format(this.y ?? 0)}</div>`;
          }
        }
      }
    },
    tooltip: {
      useHTML: true,
      split: false,
      shared: false,
      outside: true,
      formatter(this: RangePoint) {
        const range = `${format(this.low ?? 0)} - ${format(this.high ?? 0)}`;
        return tooltipHtml(options, [`<span>${escape(String(this.name ?? this.category ?? ''))}</span>`, `${colorDot(this.color)}${escape(xAxisName)}: <b>${range}</b>`]);
      }
    },
    series: [
      {
        type,
        name: xAxisName,
        data: response.records.map(([name, low, high]) => ({ name: String(name ?? ''), low: toNumber(low), high: toNumber(high) }))
      } as Highcharts.SeriesOptionsType
    ]
  };

  return merge({}, BASE_CONFIG, SERIES_DEFAULTS, options, manual) as Highcharts.Options;
}
