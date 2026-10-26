import { asArray, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { ValueControlType, type ControlValues } from '@/core/query/controlValues';
import { DateMode, rangeValues } from '@/core/query/dateRanges';
import { functionColumns, functionKey } from '@/core/query/dynamicFunctions';
import type { TableResponse } from '@/core/query/VisualizationResponse';

export interface FilterOption {
  label: string;
  value: string;
}

/** v1 `TabFilterDisplay`. */
export const TabFilterDisplay = {
  Normal: 'normal',
  SingleChoice: 'single_choice',
  MultiChoice: 'multi_choice',
  DropDown: 'drop_down',
  Flat: 'flat'
} as const;

/**
 * A filter's options from its `viz_table_response`: rows are `[label, value]`, or just `[value]` without a label
 * column (v1 `TabFilter.buildFilterOptions`).
 */
export function filterOptions(response: TableResponse, sortByLabel: boolean): FilterOption[] {
  const valueIndex = response.headers.length === 2 ? 1 : 0;
  const options = response.records.map(row => ({ label: String(row[0] ?? ''), value: String(row[valueIndex] ?? '') }));
  return sortByLabel ? options.sort((a, b) => a.label.localeCompare(b.label)) : options;
}

/** The selected values; none means "All". */
export function selectionOf(values: ControlValues | undefined): string[] {
  return [...(values?.[ValueControlType.SelectedValue] ?? [])];
}

export function selectionToControl(selected: readonly string[]): ControlValues {
  return selected.length === 0 ? {} : { [ValueControlType.SelectedValue]: [...selected] };
}

/** v1 multi choice: toggling builds the selection, and choosing every option is the same as All. */
export function toggleOption(selected: readonly string[], value: string, optionCount: number): string[] {
  const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
  return next.length >= optionCount ? [] : next;
}

/** A tab control's options: one per column, sorted by name (v1 `TabFilter.buildFunctionOptions`). */
export function functionOptions(setting: JsonObject): FilterOption[] {
  return functionColumns(setting)
    .map((column, index) => ({ label: asString(column['name']), value: functionKey(column, index) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** A tab control in multi choice: toggles a column, but keeps at least one (v1 `handleMultiDynamicFunctionSelect`). */
export function toggleRequiredOption(selected: readonly string[], value: string): string[] {
  if (!selected.includes(value)) return [...selected, value];
  return selected.length === 1 ? [...selected] : selected.filter(item => item !== value);
}

/** v1 search: case-insensitive "contains" on the label. */
export function searchOptions(options: readonly FilterOption[], keyword: string): FilterOption[] {
  const needle = keyword.trim().toLowerCase();
  return needle ? options.filter(option => option.label.toLowerCase().includes(needle)) : [...options];
}

/** A date select's mode and range: the stored mode, else Custom when it holds dates, else All Time. */
export function dateSelectionOf(values: (ControlValues & { mode?: DateMode }) | undefined): { mode: DateMode; range: string[] } {
  const min = values?.[ValueControlType.MinValue]?.[0];
  const max = values?.[ValueControlType.MaxValue]?.[0];
  const range = min !== undefined && max !== undefined ? [min, max] : [];
  return { mode: values?.mode ?? (range.length === 2 ? DateMode.Custom : DateMode.AllTime), range };
}

/** A picked mode or custom range as a control, relative modes computed against `now` (v1 `DateFilter2.applyFilter`). */
export function dateSelectionToControl(mode: DateMode, dates: readonly string[], now: Date): ControlValues & { mode: DateMode } {
  const [min, max] = rangeValues(mode, dates, now);
  return min !== undefined && max !== undefined
    ? { mode, [ValueControlType.MinValue]: [min], [ValueControlType.MaxValue]: [max] }
    : { mode: DateMode.AllTime };
}

/** v1 `ChartUtils.isNumberType`. */
const NUMBER_TYPES = new Set(['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'float64', 'double']);

/** An input filter takes numbers when its column is numeric, or, without column, when its options say so. */
export function isNumberInput(setting: JsonObject, isNumberOption: unknown): boolean {
  const column = asArray(setting['values'])[0];
  if (!isRecord(column)) return isNumberOption === true;
  return NUMBER_TYPES.has(asString(getPath(column, ['function', 'field', 'field_type'])).toLowerCase());
}
