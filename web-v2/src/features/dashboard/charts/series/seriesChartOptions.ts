import type Highcharts from 'highcharts';
import { cloneDeep, merge } from 'lodash-es';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { vizKey, type VizOptions } from '@/core/query/vizOptions';
import { createNumberFormat } from '../numberFormat';
import { BASE_CONFIG, axisLabel, chartColors, isInsideCondition, titleText, type MinMaxCondition } from '../highchartsBase';

/** v1 `SeriesChartOption.DEFAULT_SETTING`. */
const SERIES_DEFAULTS = {
  chart: { zoomType: 'x' },
  yAxis: [
    { tickLength: 0, opposite: false, tickAmount: undefined },
    { tickLength: 0, opposite: true, tickAmount: undefined, title: { text: '' } }
  ],
  xAxis: { lineWidth: 0.5, lineColor: 'var(--grid-line-color)' },
  plotOptions: {
    series: {
      borderWidth: 0,
      borderColor: 'black',
      dataLabels: {
        borderWidth: 0,
        textOutline: '0px contrast',
        useHTML: true,
        style: { border: '0px', borderColor: 'none', textShadow: false }
      },
      label: { enabled: false }
    }
  }
};

/** v1 `ChartUtils.isTimeStampType`: x axis functions that return epoch values, drawn on a datetime axis. */
const TIMESTAMP_FUNCTIONS = new Set(['datetime_to_seconds', 'datetime_to_millis', 'datetime_to_nanos']);

export function isTimestampFunction(scalarFunctionClassName: string | undefined): boolean {
  return TIMESTAMP_FUNCTIONS.has((scalarFunctionClassName ?? '').toLowerCase());
}

type AxisOptions = Record<string, unknown> & { condition?: MinMaxCondition };

interface SeriesOptionsInput {
  options: VizOptions;
  response: SeriesOneResponse;
  themeColors: readonly string[];
  /** The x axis groups by a timestamp function (`datetime_to_millis`, ...). */
  timestampXAxis: boolean;
}

/** v1 `SeriesChartOption.toSeriesOptions`: dual axis, `stacking: 'none'` and percent stacking fixes. */
function normalize(stored: VizOptions): VizOptions {
  const options = cloneDeep(stored);
  const yAxis = (Array.isArray(options.yAxis) ? options.yAxis : []) as AxisOptions[];
  const dualAxis = options['dualAxis'];
  if (dualAxis !== undefined && dualAxis !== -1 && yAxis.length < 2 && yAxis[0]) {
    const { title: _title, ...axis } = cloneDeep(yAxis[0]);
    yAxis[1] = { ...axis, opposite: true, id: 'dual-axis' };
    options.yAxis = yAxis as Highcharts.YAxisOptions[];
  }
  const series = options.plotOptions?.series as (Record<string, unknown> & { stacking?: unknown }) | undefined;
  if (series?.stacking === 'none') series.stacking = undefined;
  else if (series?.stacking === 'percent') series['threshold'] = 0;
  return options;
}

function axisRange(axis: AxisOptions | undefined) {
  const condition = axis?.condition;
  if (!condition?.enabled) return { min: undefined, max: undefined };
  return {
    min: condition.min?.enabled ? condition.min.value : undefined,
    max: condition.max?.enabled ? condition.max.value : undefined
  };
}

function seriesList(options: VizOptions, response: SeriesOneResponse, timestampXAxis: boolean): Highcharts.SeriesOptionsType[] {
  const defaultType = options.chart?.type ?? 'line';
  const perSeries = ((options.plotOptions?.series as Record<string, unknown> | undefined)?.['response'] ?? {}) as Record<string, object>;
  return response.series.map(item => {
    const key = vizKey(item.name);
    const type = options.typesByLabel?.[key] ?? defaultType;
    const data = timestampXAxis ? item.data.map((value, index) => [Number(response.xAxis[index]), value]) : [...item.data];
    return {
      name: item.name,
      data,
      type,
      ...(item.yAxis !== undefined && { yAxis: item.yAxis }),
      ...perSeries[key],
      // v1: the server's per-series `stack` split one stack into one per legend value.
      stack: undefined,
      ...(type === 'line' && item.data.length === 1 && { marker: { enabled: true } })
    } as Highcharts.SeriesOptionsType;
  });
}

/** Column, bar, line and area charts (v1 `SeriesChart.vue`): stored viz options + the response → Highcharts options. */
export function buildSeriesChartOptions({ options: stored, response, themeColors, timestampXAxis }: SeriesOptionsInput): Highcharts.Options {
  const options = normalize(stored);
  const series = options.plotOptions?.series as Record<string, unknown> | undefined;
  const dataLabels = (series?.['dataLabels'] ?? {}) as { displayUnit?: string; condition?: MinMaxCondition; style?: { color?: string } };
  const format = createNumberFormat({
    displayUnit: dataLabels.displayUnit,
    precision: options.precision,
    decimalPoint: options.decimalPoint,
    thousandSep: options.thousandSep
  });
  const yAxis = (Array.isArray(options.yAxis) ? options.yAxis : []) as AxisOptions[];
  const xAxis = (Array.isArray(options.xAxis) ? options.xAxis : [options.xAxis ?? {}]) as AxisOptions[];
  const tooltipStyle = (options.tooltip?.style ?? {}) as { color?: string; fontFamily?: string };
  const labelColor = dataLabels.style?.color ?? '#fff';

  const manual: Highcharts.Options = {
    chart: { type: options.chart?.type ?? 'line' },
    colors: chartColors(options, themeColors),
    title: { text: titleText(stored.title) ?? '' },
    subtitle: { text: titleText(stored.subtitle) ?? '', useHTML: true },
    xAxis: timestampXAxis
      ? { type: 'datetime', dateTimeLabelFormats: { day: '%Y-%m-%d' } }
      : [
          {
            type: 'category',
            categories: [...response.xAxis],
            labels: {
              formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
                return axisLabel(String(this.value), xAxis[0]);
              }
            }
          }
        ],
    yAxis: [0, 1].map(index => ({
      ...axisRange(yAxis[index]),
      labels: {
        formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
          return axisLabel(format(Number(this.value)), yAxis[index]);
        }
      }
    })),
    plotOptions: {
      series: {
        cursor: 'pointer',
        dataLabels: {
          useHTML: true,
          formatter(this: Highcharts.Point) {
            const y = this.y ?? 0;
            return isInsideCondition(y, dataLabels.condition) ? `<div style="color: ${labelColor}">${format(y)}</div>` : '';
          }
        }
      }
    },
    tooltip: {
      useHTML: true,
      split: false,
      shared: false,
      outside: true,
      formatter(this: Highcharts.Point) {
        const x = timestampXAxis ? formatDateTime(Number(this.x)) : (this.category ?? this.x);
        return `<div style="text-align: left; color: ${tooltipStyle.color ?? 'var(--text-color)'}; font-family: ${tooltipStyle.fontFamily ?? 'var(--widget-secondary-font-family, Roboto)'}">
            <span>${String(x)}</span><br/>
            <span style="color:${String(this.color)}; padding-right: 5px;">●</span>${this.series.name}: <b>${format(this.y ?? 0)}</b>
          </div>`;
      }
    },
    series: seriesList(options, response, timestampXAxis)
  };

  return merge({}, BASE_CONFIG, SERIES_DEFAULTS, options, manual) as Highcharts.Options;
}

/** v1 `DateTimeUtils.formatAsDDMMYYYYHms`. */
function formatDateTime(epochMillis: number): string {
  const date = new Date(epochMillis);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
