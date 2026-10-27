import { get } from 'lodash-es';
import { CompareMode, compareRangeOf, type StoredRange } from '@/core/query/comparison';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import { asString, isRecord, type JsonObject } from '@/core/json/json';
import { DateMode, dateRangeOf, isDateMode } from '@/core/query/dateRanges';
import type { VizOptions } from '@/core/query/vizOptions';
import { isDateType } from '@/core/schema/fieldTypes';
import type { TableNode } from '../../field-tree/fieldTree.utils';

/** v1 number `ComparisonTab`: the date range, the period it is compared with and the trend line. */

export interface DateFieldChoice {
  readonly label: string;
  /** `db.table.column`, the key a stored field is matched by. */
  readonly value: string;
  readonly field: JsonObject;
}

/** A field's key, from the stored (snake_case) or the read (camelCase) options. */
export function fieldKeyOf(field: unknown): string {
  if (!isRecord(field)) return '';
  const read = (snake: string, camel: string) => asString(field[snake] ?? field[camel]);
  return [read('db_name', 'dbName'), read('tbl_name', 'tblName'), read('field_name', 'fieldName')].join('.');
}

/** The key of the range's stored date column. */
export function dateFieldKeyOf(viz: VizOptions): string {
  return fieldKeyOf(get(viz, 'dataRange.dateField'));
}

/**
 * The date columns of the builder's tables (v1 `dateOptions`, every table of the database, not only the chart's), by
 * table then column. Nested columns are left out.
 */
export function dateFieldChoicesOf(tables: readonly TableNode[]): DateFieldChoice[] {
  return tables.flatMap(table =>
    table.items.flatMap(item =>
      item.kind === 'field' && item.role === 'column' && isDateType(item.type)
        ? [{ label: `${table.title}.${item.title}`, value: fieldKeyOf(item.dropped.field), field: item.dropped.field }]
        : []
    )
  );
}

/** v1 saved ranges as its `Date`s turned to JSON: ISO strings. */
export function storedRange([start, end]: StoredRange): { start: string; end: string } {
  return { start: start.toISOString(), end: end.toISOString() };
}

export function rangeAt(viz: VizOptions, path: string): StoredRange | undefined {
  const value: unknown = get(viz, path);
  if (!isRecord(value)) return undefined;
  const start = new Date(asString(value['start']));
  const end = new Date(asString(value['end']));
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? undefined : [start, end];
}

export function dateModeOf(viz: VizOptions): DateMode {
  const mode: unknown = get(viz, 'dataRange.mode');
  return isDateMode(mode) ? mode : DateMode.Last30Days;
}

export function compareModeOf(viz: VizOptions): CompareMode {
  const mode: unknown = get(viz, 'comparison.mode');
  return Object.values(CompareMode).includes(mode as CompareMode) ? (mode as CompareMode) : CompareMode.SamePeriodLastMonth;
}

/** The range a mode covers now; a custom one keeps its dates, all time has none. */
function modeRange(mode: DateMode, now: Date, custom: StoredRange | undefined): StoredRange | undefined {
  if (mode === DateMode.Custom) return custom;
  const range = dateRangeOf(mode, now);
  return range ? [range.start, range.end] : undefined;
}

/** The compared period's range, kept for v1, which showed it in the comparison calendar. */
function compareRangeChanges(compareMode: CompareMode, range: StoredRange | undefined, custom?: StoredRange): VizChanges {
  const compared = compareMode === CompareMode.Custom ? custom : range && compareRangeOf(compareMode, range);
  return compared ? { 'comparison.dateRange': storedRange(compared) } : {};
}

/**
 * A new date range mode (v1 `handleDataRangeChanged`): its range is saved too, as v1 did, and a preset comparison's
 * range follows it.
 */
export function dateRangeModeChanges(viz: VizOptions, mode: DateMode, now: Date, custom?: StoredRange): VizChanges {
  const range = modeRange(mode, now, custom ?? rangeAt(viz, 'dataRange.dateRange'));
  const compareMode = compareModeOf(viz);
  return {
    'dataRange.mode': mode,
    ...(range && { 'dataRange.dateRange': storedRange(range) }),
    ...(compareMode !== CompareMode.Custom && compareRangeChanges(compareMode, range))
  };
}

/**
 * v1 `handleDataRangeEnabled`: turning the range on saves its field (the stored one, else the first date column), its
 * mode (last 30 days by default) and its range.
 */
export function dataRangeToggle(viz: VizOptions, enabled: boolean, choices: readonly DateFieldChoice[], now: Date): VizChanges {
  if (!enabled) return { 'dataRange.enabled': false };
  const stored: unknown = get(viz, 'dataRange.dateField');
  const field = choices.find(choice => choice.value === fieldKeyOf(stored))?.field ?? choices[0]?.field;
  return { 'dataRange.enabled': true, ...(field && { 'dataRange.dateField': field }), ...dateRangeModeChanges(viz, dateModeOf(viz), now) };
}

/** v1 `handleComparisonEnabled`: the comparison starts as the same period last month, with its range. */
export function comparisonToggle(viz: VizOptions, enabled: boolean): VizChanges {
  if (!enabled) return { 'comparison.enabled': false };
  const compareMode = compareModeOf(viz);
  return {
    'comparison.enabled': true,
    'comparison.mode': compareMode,
    'comparison.compareStyle': 'default',
    ...compareRangeChanges(compareMode, rangeAt(viz, 'dataRange.dateRange'), rangeAt(viz, 'comparison.dateRange'))
  };
}

export function compareModeChanges(viz: VizOptions, compareMode: CompareMode, custom?: StoredRange): VizChanges {
  return { 'comparison.mode': compareMode, ...compareRangeChanges(compareMode, rangeAt(viz, 'dataRange.dateRange'), custom ?? rangeAt(viz, 'comparison.dateRange')) };
}

/**
 * v1 `ComparisonTab.handleRevert`: everything off, the choices kept. v1's trend line toggle also wrote `trendBy` under
 * `comparison` and reset the trend's color; v2 does neither.
 */
export function comparisonRevert(): VizChanges {
  return { 'dataRange.enabled': false, 'comparison.enabled': false, 'trendLine.enabled': false };
}
