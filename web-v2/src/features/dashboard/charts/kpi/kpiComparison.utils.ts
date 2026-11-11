import type Highcharts from 'highcharts';
import { asRecord, asString, type JsonObject } from '@/core/json/json';
import type { VizOptions } from '@/core/query/vizOptions';

/** A number chart's comparison with another period and its trend line (v1 `NumberWidget` and its layouts). */

const INCREASE = '#4dcf36';
const DECREASE = '#ea6b6b';
const INCREASE_FILL = '#eaffe7';
const DECREASE_FILL = '#ffeded';

export interface KpiComparison {
  /** `(value - compared) / compared`, in percent, two decimals. */
  percentage: number;
  isDecrease: boolean;
  /** Themed layouts' text: the signed percentage, or the compared value. */
  text: string;
  /** Themed layouts' color: the value's, or the increase / decrease color. */
  color: string;
  /** The plain layouts' comparison (v1 `PercentageBar`). */
  bar: KpiComparisonBar;
}

/** v1 `CompareStyle`: the icon with the change and the compared value, either of them alone, or the value on a line of its own. */
export type CompareStyle = 'default' | 'percentage' | 'number' | 'text';

const COMPARE_STYLES: ReadonlySet<unknown> = new Set<CompareStyle>(['percentage', 'number', 'text']);

export interface KpiComparisonBar {
  displayAs: CompareStyle;
  /** The trend icon's class and its color, which the change takes too. */
  icon: string;
  color: string;
  /** The change without its sign. */
  percentage: string;
  /** The compared value, formatted like the value. */
  value: string;
}

export interface KpiTrend {
  data: readonly (number | null)[];
  displayAs: 'line' | 'area';
  color: string;
  /**
   * The layouts without theme draw the trend as a series chart of its own (v1 `ChartHolder`): straight segments, each
   * point in the middle of its category, an area in the pale `fill`. Themed layouts draw a spline from edge to edge.
   */
  plain?: { fill: string };
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

/** Whether the plain layout makes room for the date range and the comparison (v1 `NoneThemeLayout.render`). */
export function hasComparisonArea(options: VizOptions): boolean {
  return isOn(options, 'dataRange') || isComparisonOn(options);
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** v1 `NumberWidget.trendIcon`, `numberWidgetStyle` and `comparisonDisplayAs`: the stored icons and colors, else an arrow in green or red. */
function comparisonBarOf(options: VizOptions, percentage: number, value: string): KpiComparisonBar {
  const setting = optionsRecord(options, 'comparison');
  const isDecrease = percentage < 0;
  const style = setting['compareStyle'];
  return {
    displayAs: COMPARE_STYLES.has(style) ? (style as CompareStyle) : 'default',
    icon: asString(setting[isDecrease ? 'downtrendIcon' : 'uptrendIcon']) || (isDecrease ? 'di-icon-down' : 'di-icon-up'),
    color: asString(setting[isDecrease ? 'downtrendIconColor' : 'uptrendIconColor']) || (isDecrease ? DECREASE : INCREASE),
    percentage: `${Math.abs(percentage)}%`,
    value
  };
}

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
    bar: comparisonBarOf(options, percentage, format(compared))
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
  if (!themed) {
    const isDecrease = comparison?.isDecrease === true;
    return { data, displayAs, color: isDecrease ? DECREASE : INCREASE, plain: { fill: isDecrease ? DECREASE_FILL : INCREASE_FILL } };
  }
  const color = setting['colorByPercentage'] === true && comparison ? comparison.color : asString(setting['color'], '#007126');
  return { data, displayAs, color };
}

/**
 * v1 `TrendLineChart` / `TrendAreaChart`: a bare spline (or area) of the values, axes, legend and tooltip off. A plain
 * trend (v1 `ComparisonUtils.getTrendLineChartOption`) is a line (or area) chart over categories instead.
 */
export function trendChartOptions({ data, displayAs, color, plain }: KpiTrend): Highcharts.Options {
  const isArea = displayAs === 'area';
  const type = plain ? (isArea ? 'area' : 'line') : isArea ? 'areaspline' : 'spline';
  const fill = plain ? { fillColor: plain.fill } : { fillOpacity: 0.2 };
  return {
    chart: { type, backgroundColor: 'transparent', spacing: [0, 0, 0, 0], margin: [0, 0, 0, 0] },
    title: { text: undefined },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: { enabled: false },
    tooltip: { enabled: false },
    xAxis: { visible: false, ...(plain && { min: -0.5, max: data.length - 0.5 }) },
    yAxis: { visible: false },
    plotOptions: { series: { enableMouseTracking: false, marker: { enabled: false }, lineWidth: 2, ...(isArea && fill) } },
    series: [{ type, data: [...data], color }]
  };
}
