import type Highcharts from 'highcharts';
import { asRecord, asString, type JsonObject } from '@/core/json/json';
import type { VizOptions } from '@/core/query/vizOptions';

/** A number chart's comparison with another period and its trend line (v1 `NumberWidget` and its layouts). */

const INCREASE = '#4dcf36';
const DECREASE = '#ea6b6b';

export interface KpiComparison {
  /** `(value - compared) / compared`, in percent, two decimals. */
  percentage: number;
  isDecrease: boolean;
  /** Themed layouts' text: the signed percentage, or the compared value. */
  text: string;
  /** Themed layouts' color: the value's, or the increase / decrease color. */
  color: string;
  /** The plain layout's text: the percentage without sign and the compared value (v1 `PercentageBar`). */
  barText: string;
  barColor: string;
  barIcon: string;
}

export interface KpiTrend {
  data: readonly (number | null)[];
  displayAs: 'line' | 'area';
  color: string;
}

function optionsRecord(options: VizOptions, key: string): JsonObject {
  return asRecord(options[key]);
}

const isOn = (options: VizOptions, key: string) => optionsRecord(options, key)['enabled'] === true;

/** Whether the options ask for a comparison: it needs a date range (v1 `ComparisonUtils.isComparisonOn`). */
export function isComparisonOn(options: VizOptions): boolean {
  return isOn(options, 'dataRange') && isOn(options, 'comparison');
}

/** Whether the options ask for a trend line: it needs a date range (v1 `ComparisonUtils.isTrendLineOn`). */
export function isTrendLineOn(options: VizOptions): boolean {
  return isOn(options, 'dataRange') && isOn(options, 'trendLine');
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * The comparison shown next to the value, `undefined` when the compared value is missing or 0 (v1
 * `hasCompareValue`). v1's themed layouts showed the compared value unformatted; v2 formats it like the value.
 */
export function kpiComparisonOf(options: VizOptions, value: number | undefined, compared: number | undefined, format: (value: number) => string): KpiComparison | undefined {
  if (!isComparisonOn(options) || value === undefined || compared === undefined || compared === 0) return undefined;
  const percentage = round2(((value - compared) / compared) * 100);
  const isDecrease = percentage < 0;
  const setting = optionsRecord(options, 'percentage');
  const sign = percentage > 0 ? '+' : '';
  const ownColor = asString(asRecord(options['style'])['color']);
  const color =
    setting['colorByInherit'] === true && ownColor
      ? ownColor
      : isDecrease
        ? asString(setting['decreaseColor'], '#FF4C13')
        : asString(setting['increaseColor'], '#07BC40');
  return {
    percentage,
    isDecrease,
    text: `${sign}${setting['display'] === 'value' ? format(compared) : `${percentage}%`}`,
    color,
    barText: `${Math.abs(percentage)}% (${format(compared)})`,
    barColor: isDecrease ? DECREASE : INCREASE,
    barIcon: isDecrease ? 'di-icon-down' : 'di-icon-up'
  };
}

/**
 * The trend line, once its data is in. Themed layouts draw it in its own color, or the comparison's; the plain layout
 * in green or red (v1 `ComparisonUtils.getTrendLineChartOption`).
 */
export function kpiTrendOf(options: VizOptions, data: readonly (number | null)[] | undefined, comparison: KpiComparison | undefined, themed: boolean): KpiTrend | undefined {
  if (!isTrendLineOn(options) || !data) return undefined;
  const setting = optionsRecord(options, 'trendLine');
  const displayAs = setting['displayAs'] === 'area' ? 'area' : 'line';
  if (!themed) return { data, displayAs, color: comparison?.isDecrease ? DECREASE : INCREASE };
  const color = setting['colorByPercentage'] === true && comparison ? comparison.color : asString(setting['color'], '#007126');
  return { data, displayAs, color };
}

/** v1 `TrendLineChart` / `TrendAreaChart`: a bare spline (or area) of the values, axes, legend and tooltip off. */
export function trendChartOptions({ data, displayAs, color }: KpiTrend): Highcharts.Options {
  const type = displayAs === 'area' ? 'areaspline' : 'spline';
  return {
    chart: { type, backgroundColor: 'transparent', spacing: [0, 0, 0, 0], margin: [0, 0, 0, 0] },
    title: { text: undefined },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: { enabled: false },
    tooltip: { enabled: false },
    xAxis: { visible: false },
    yAxis: { visible: false },
    plotOptions: { series: { enableMouseTracking: false, marker: { enabled: false }, lineWidth: 2, ...(type === 'areaspline' && { fillOpacity: 0.2 }) } },
    series: [{ type, data: [...data], color }]
  };
}
