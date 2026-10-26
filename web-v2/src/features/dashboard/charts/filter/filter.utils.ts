import { ValueControlType, type ControlValues } from '@/core/query/controlValues';
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

/** v1 search: case-insensitive "contains" on the label. */
export function searchOptions(options: readonly FilterOption[], keyword: string): FilterOption[] {
  const needle = keyword.trim().toLowerCase();
  return needle ? options.filter(option => option.label.toLowerCase().includes(needle)) : [...options];
}
