import { asRecord, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { DateMode, formatDateTime, isDateMode } from './dateRanges';
import type { FilterRequestJson } from './QueryRequest';

/**
 * A number chart's date range, comparison and trend line (v1 `ComparisonUtils`), read from its stored viz options
 * (`data_range`, `comparison`, `trend_line`) and turned into what the query sends: a date filter, a `compare_request`,
 * and the trend line's own series query.
 */

/** v1 `CompareMode` of the comparison calendar. */
export const CompareMode = {
  PreviousPeriod: 'previous_period',
  SamePeriodLastMonth: 'same_period_last_month',
  SamePeriodLastQuarter: 'same_period_last_quarter',
  SamePeriodLastYear: 'same_period_last_year',
  Custom: 'custom'
} as const;

export type CompareMode = (typeof CompareMode)[keyof typeof CompareMode];

export const COMPARE_MODE_OPTIONS: readonly { value: CompareMode; label: string }[] = [
  { value: CompareMode.PreviousPeriod, label: 'Previous Period' },
  { value: CompareMode.SamePeriodLastMonth, label: 'Same Period Last Month' },
  { value: CompareMode.SamePeriodLastQuarter, label: 'Same Period Last Quarter' },
  { value: CompareMode.SamePeriodLastYear, label: 'Same Period Last Year' },
  { value: CompareMode.Custom, label: 'Custom' }
];

const COMPARE_MODES = new Set<string>(Object.values(CompareMode));

function isCompareMode(value: unknown): value is CompareMode {
  return typeof value === 'string' && COMPARE_MODES.has(value);
}

/** A stored range (v1 `DateRange`, its dates saved as ISO strings), as `[start, end]` dates. */
export type StoredRange = readonly [Date, Date];

export interface NumberComparison {
  /** The date column the range applies to, as the server takes it. */
  field: JsonObject;
  mode: DateMode;
  range?: StoredRange;
  compare?: { mode: CompareMode; range?: StoredRange };
  trend?: { trendBy: string; displayAs: string; color: string; colorByPercentage: boolean };
}

function rangeOf(value: unknown): StoredRange | undefined {
  if (!isRecord(value)) return undefined;
  const start = new Date(asString(value['start']));
  const end = new Date(asString(value['end']));
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? undefined : [start, end];
}

function optionsOf(setting: JsonObject): JsonObject {
  return asRecord(getPath(setting, ['options', 'options']));
}

/** What the chart's options turn on: nothing without a date range; comparison and trend line only with one. */
export function numberComparisonOf(setting: JsonObject): NumberComparison | undefined {
  const options = optionsOf(setting);
  const dataRange = asRecord(options['data_range']);
  const field = dataRange['date_field'];
  if (dataRange['enabled'] !== true || !isRecord(field)) return undefined;
  const mode = isDateMode(dataRange['mode']) ? dataRange['mode'] : DateMode.Custom;
  const comparison = asRecord(options['comparison']);
  const trendLine = asRecord(options['trend_line']);
  return {
    field,
    mode,
    range: rangeOf(dataRange['date_range']),
    ...(comparison['enabled'] === true && {
      compare: { mode: isCompareMode(comparison['mode']) ? comparison['mode'] : CompareMode.PreviousPeriod, range: rangeOf(comparison['date_range']) }
    }),
    ...(trendLine['enabled'] === true && {
      trend: {
        trendBy: asString(trendLine['trend_by'], 'Month of'),
        displayAs: asString(trendLine['display_as'], 'line'),
        color: asString(trendLine['color'], '#007126'),
        colorByPercentage: trendLine['color_by_percentage'] === true
      }
    })
  };
}

function between(field: JsonObject, [start, end]: StoredRange): JsonObject {
  return { class_name: 'between_and_including', field, min: formatDateTime(start), max: formatDateTime(end, true) };
}

/** v1 `ConditionUtils.buildDateFilterCondition`: relative modes are computed by the server, custom by its range. */
const MODE_CONDITIONS: Readonly<Partial<Record<DateMode, JsonObject>>> = {
  [DateMode.ThisDay]: { class_name: 'current_day' },
  [DateMode.ThisWeek]: { class_name: 'current_week' },
  [DateMode.ThisMonth]: { class_name: 'current_month' },
  [DateMode.ThisQuarter]: { class_name: 'current_quarter' },
  [DateMode.ThisYear]: { class_name: 'current_year' },
  [DateMode.LastDay]: { class_name: 'last_n_day', n_day: '1' },
  [DateMode.LastWeek]: { class_name: 'last_n_week', n_week: '1' },
  [DateMode.LastMonth]: { class_name: 'last_n_month', n_month: '1' },
  [DateMode.LastQuarter]: { class_name: 'last_n_quarter', n_quarter: '1' },
  [DateMode.LastYear]: { class_name: 'last_n_year', n_year: '1' },
  [DateMode.Last7Days]: { class_name: 'last_n_day', n_day: '7' },
  [DateMode.Last30Days]: { class_name: 'last_n_day', n_day: '30' }
};

/** The range's condition on the date column; nothing for all time, or for custom without a range. */
export function dateRangeCondition({ field, mode, range }: Pick<NumberComparison, 'field' | 'mode' | 'range'>): JsonObject | undefined {
  if (mode === DateMode.Custom) return range && between(field, range);
  const condition = MODE_CONDITIONS[mode];
  return condition && { ...condition, field };
}

const past = (unit: 'day' | 'week' | 'month' | 'quarter' | 'year', count = 1): JsonObject => ({ class_name: `past_n_${unit}`, [`n_${unit}`]: count });

/**
 * How far back the compared period is for a relative mode (v1 `ComparisonUtils.getIntervalPeriodFn`). v1 moved the
 * last 7 or 30 days back by one day for the previous period; v2 moves them back by their length.
 */
function intervalOf(mode: DateMode, compareMode: CompareMode): JsonObject | undefined {
  switch (compareMode) {
    case CompareMode.SamePeriodLastMonth:
      return past('month');
    case CompareMode.SamePeriodLastQuarter:
      return past('quarter');
    case CompareMode.SamePeriodLastYear:
      return past('year');
    case CompareMode.PreviousPeriod:
      break;
    default:
      return undefined;
  }
  switch (mode) {
    case DateMode.ThisDay:
    case DateMode.LastDay:
      return past('day');
    case DateMode.Last7Days:
      return past('day', 7);
    case DateMode.Last30Days:
      return past('day', 30);
    case DateMode.ThisWeek:
    case DateMode.LastWeek:
      return past('week');
    case DateMode.ThisMonth:
    case DateMode.LastMonth:
      return past('month');
    case DateMode.ThisQuarter:
    case DateMode.LastQuarter:
      return past('quarter');
    case DateMode.ThisYear:
    case DateMode.LastYear:
      return past('year');
    default:
      return undefined;
  }
}

const DAY = 24 * 60 * 60 * 1000;

function shiftMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() - months, date.getDate());
}

/** v1 `DateUtils.getCompareDateRange`: the period before a custom range, or the same one a month, quarter, year back. */
export function compareRangeOf(compareMode: CompareMode, [start, end]: StoredRange): StoredRange | undefined {
  switch (compareMode) {
    case CompareMode.PreviousPeriod: {
      const days = Math.round((end.getTime() - start.getTime()) / DAY);
      const previousEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
      return [new Date(previousEnd.getFullYear(), previousEnd.getMonth(), previousEnd.getDate() - days), previousEnd];
    }
    case CompareMode.SamePeriodLastMonth:
      return [shiftMonths(start, 1), shiftMonths(end, 1)];
    case CompareMode.SamePeriodLastQuarter:
      return [shiftMonths(start, 3), shiftMonths(end, 3)];
    case CompareMode.SamePeriodLastYear:
      return [shiftMonths(start, 12), shiftMonths(end, 12)];
    default:
      return undefined;
  }
}

function secondCondition(comparison: NumberComparison, compare: NonNullable<NumberComparison['compare']>): JsonObject | undefined {
  const { field, mode, range } = comparison;
  if (compare.mode === CompareMode.Custom) return compare.range && between(field, compare.range);
  if (mode === DateMode.Custom) {
    const compared = range && compareRangeOf(compare.mode, range);
    return compared && between(field, compared);
  }
  const first = dateRangeCondition(comparison);
  const interval = intervalOf(mode, compare.mode);
  return first && interval && { ...first, interval_function: interval };
}

/**
 * The `compare_request` of a number chart with a comparison (v1 `ComparisonUtils.toCompareRequest`): the range, and the
 * period it is compared with. All time compares with nothing, so its compare value is the total.
 */
export function compareRequestOf(setting: JsonObject): JsonObject | undefined {
  const comparison = numberComparisonOf(setting);
  if (!comparison?.compare) return undefined;
  const first = dateRangeCondition(comparison);
  const second = secondCondition(comparison, comparison.compare);
  return { mode: 'RawValues', ...(first && { first_condition: first }), ...(second && { second_condition: second }) };
}

/**
 * The date filter of a number chart with a range and no comparison (v1 `ComparisonUtils.getDateFilterRequests`). v1
 * filtered by the range saved with the chart, so "last 30 days" stayed the 30 days before it was saved; v2 lets the
 * server compute relative modes, as v1 did for comparisons.
 */
export function dateRangeFilterRequests(setting: JsonObject): FilterRequestJson[] {
  const comparison = numberComparisonOf(setting);
  if (!comparison || comparison.compare) return [];
  const condition = dateRangeCondition(comparison);
  return condition ? [{ filter_id: -1, condition, is_apply_relatively: true, is_active: true }] : [];
}

/** v1 trend line's x axis per "Trend by" (`DateHistogramFunctionBuilder`). */
const TREND_SCALARS: Readonly<Record<string, string>> = {
  'Second of': 'to_second_num',
  'Minute of': 'to_minute_num',
  'Hour of': 'to_hour_num',
  'Day of': 'to_day_num',
  'Week of': 'to_week_num',
  'Month of': 'to_month_num',
  'Quarter of': 'to_quarter_num',
  'Yearly of': 'to_year_num'
};

export const TREND_BY_OPTIONS: readonly string[] = Object.keys(TREND_SCALARS);

/**
 * The trend line's series query (v1 `ComparisonUtils.buildTrendLineQuerySetting`): the value over time, in the range.
 * v1 dropped the chart's own filters; v2 keeps them.
 */
export function trendLineSettingOf(setting: JsonObject): JsonObject | undefined {
  const comparison = numberComparisonOf(setting);
  const value = setting['value'];
  if (!comparison?.trend || !isRecord(value)) return undefined;
  const xFunction = {
    class_name: 'group',
    field: comparison.field,
    scalar_function: { class_name: TREND_SCALARS[comparison.trend.trendBy] ?? 'to_month_num' }
  };
  const condition = dateRangeCondition(comparison);
  const filters = Array.isArray(setting['filters']) ? setting['filters'] : [];
  return {
    class_name: 'series_chart_setting',
    x_axis: { name: asString(comparison.field['field_name']), function: xFunction },
    y_axis: [value],
    filters: condition ? [...filters, condition] : filters,
    sorts: [{ class_name: 'order_by', function: xFunction, order: 'ASC' }],
    options: {}
  };
}
