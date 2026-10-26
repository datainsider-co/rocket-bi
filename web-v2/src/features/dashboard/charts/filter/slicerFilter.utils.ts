import { asArray, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { ValueControlType, type ControlValues } from '@/core/query/controlValues';
import { formatDateTime } from '@/core/query/dateRanges';
import type { TableResponse } from '@/core/query/VisualizationResponse';

/**
 * Slicer filter (v1 `SlicerFilter` + `NumberSlicer`): a range over a column's min and max. Its setting queries
 * `[min(column), max(column)]`; a date column is queried as epoch millis.
 */

/** v1 `SlicerDisplay`: numbers, dates, or date parts shown as numbers (a year). */
export type SlicerKind = 'number' | 'date' | 'date_part';

export type SlicerRange = readonly [number, number];

const DATE_TYPES = new Set(['date', 'datetime', 'datetime64']);
/** v1 `isDateHistogramPeriodic`: date parts that repeat (a year, a month of year), shown as numbers. */
const DATE_PARTS = new Set([
  'to_year',
  'to_quarter',
  'to_month',
  'to_week',
  'to_day_of_year',
  'to_day_of_month',
  'to_day_of_week',
  'to_hour',
  'to_minute',
  'to_second'
]);

export function slicerKind(setting: JsonObject): SlicerKind {
  const first = asArray(setting['values'])[0];
  if (!isRecord(first)) {
    // A slicer without column only drives other charts; its options say what it holds.
    return getPath(setting, ['options', 'options', 'dynamic_settings', 'is_number']) === false ? 'date' : 'number';
  }
  const fieldType = asString(getPath(first, ['function', 'field', 'field_type'])).toLowerCase();
  if (!DATE_TYPES.has(fieldType)) return 'number';
  const scalar = asString(getPath(first, ['function', 'scalar_function', 'class_name']));
  return DATE_PARTS.has(scalar) ? 'date_part' : 'date';
}

function toNumber(value: unknown, kind: SlicerKind): number | undefined {
  if (kind === 'date' && typeof value === 'string' && Number.isNaN(Number(value))) {
    const time = new Date(value.replace(' ', 'T')).getTime();
    return Number.isNaN(time) ? undefined : time;
  }
  const number = Number(value);
  return value === null || value === '' || !Number.isFinite(number) ? undefined : number;
}

/** The slider's ends: the queried min and max, else the configured `from` / `to` (v1 `getNumberMin` and friends). */
export function slicerBounds(response: TableResponse, options: JsonObject, kind: SlicerKind): SlicerRange {
  const row = response.records[0];
  const min = toNumber(row?.[0], kind) ?? toNumber(getPath(options, ['from', 'value']), kind) ?? 0;
  const max = toNumber(row?.[1], kind) ?? toNumber(getPath(options, ['to', 'value']), kind) ?? 0;
  return [min, Math.max(min, max)];
}

/** The picked range, the whole slider when the control holds none. */
export function slicerRangeOf(values: ControlValues | undefined, bounds: SlicerRange, kind: SlicerKind): SlicerRange {
  const from = toNumber(values?.[ValueControlType.MinValue]?.[0], kind) ?? bounds[0];
  const to = toNumber(values?.[ValueControlType.MaxValue]?.[0], kind) ?? bounds[1];
  return from <= to ? [from, to] : [to, from];
}

/**
 * The range as a control: cleared when it covers the whole slider (v1 did so for slicers without column), dates as
 * `yyyy-MM-dd` start and end of day. v1 sent epoch millis for a date column, which a date condition can't compare.
 */
export function slicerToControl([from, to]: SlicerRange, bounds: SlicerRange, kind: SlicerKind): ControlValues {
  if (from <= bounds[0] && to >= bounds[1]) return {};
  const [min, max] = kind === 'date' ? [formatDateTime(new Date(from)), formatDateTime(new Date(to), true)] : [String(from), String(to)];
  return { [ValueControlType.MinValue]: [min], [ValueControlType.MaxValue]: [max] };
}
