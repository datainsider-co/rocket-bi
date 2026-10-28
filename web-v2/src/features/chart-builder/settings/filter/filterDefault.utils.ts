import { isEqual } from 'lodash-es';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import { asArray, getPath, type JsonObject } from '@/core/json/json';
import { ValueControlType } from '@/core/query/controlValues';
import { isFunctionControl } from '@/core/query/dynamicFunctions';
import { filterColumnOf, inCondition } from '@/core/query/filterRequests';
import type { VizOptions } from '@/core/query/vizOptions';
import { ChartVizClass } from '@/features/dashboard/charts/vizClass';
import type { ControlEntry } from '@/features/dashboard/controls/controls.utils';

/**
 * A filter's default value (v1 `DefaultFilterValue`, `options.default.setting`): `value` in the shape the filter reads
 * back (`defaultControlValues`), and for the filters that filter by value, the `conditions` v1 applied to a chart's
 * inner filter when the dashboard opened.
 */
export interface FilterDefault {
  readonly value: unknown;
  readonly conditions?: JsonObject;
}

function vizClassOf(setting: JsonObject): unknown {
  return getPath(setting, ['options', 'class_name']);
}

function selectionDefault(setting: JsonObject, values: readonly string[]): FilterDefault | null {
  if (values.length === 0) return null;
  if (isFunctionControl(setting)) return { value: [...values] };
  const column = filterColumnOf(setting);
  const conditions = column && inCondition(column, values);
  return { value: [...values], ...(conditions && { conditions }) };
}

/**
 * The default the filter's current selection in the preview makes (v1 `saveTempSelectedValue` of each filter), `null`
 * when it selects nothing (All), `undefined` while nothing was picked. v1 saved a slicer's range as an object that its
 * own dashboard read as a pair; v2 saves the pair.
 */
export function filterDefaultOf(setting: JsonObject, entry: ControlEntry | undefined): FilterDefault | null | undefined {
  if (!entry) return undefined;
  const selected = entry[ValueControlType.SelectedValue] ?? [];
  const min = entry[ValueControlType.MinValue]?.[0];
  const max = entry[ValueControlType.MaxValue]?.[0];
  const range = min !== undefined && max !== undefined ? [min, max] : undefined;
  switch (vizClassOf(setting)) {
    case ChartVizClass.TabFilter:
    case ChartVizClass.Dropdown:
      return selectionDefault(setting, selected);
    case ChartVizClass.Slicer:
      return range ? { value: range } : null;
    case ChartVizClass.DateSelect:
      return range && entry.mode ? { value: { mode: entry.mode, dates: range } } : null;
    case ChartVizClass.Tree: {
      const expandedKeys = asArray(getPath(setting, ['options', 'options', 'default', 'setting', 'value', 'expanded_keys']));
      return entry.keys && entry.keys.length > 0 ? { value: { selectedKeys: [...entry.keys], expandedKeys } } : null;
    }
    case ChartVizClass.Input:
      return selected[0] ? { value: selected[0] } : null;
    default:
      return undefined;
  }
}

/** Saving a default, or `null` to drop it (v1 Reset). */
export function defaultChanges(value: FilterDefault | null): VizChanges {
  return { 'default.setting': value };
}

/** The stored default's value, read in v1's camelCase (`defaultControlValues` reads the stored shape). */
export function storedDefaultOf(viz: VizOptions): unknown {
  return getPath(viz, ['default', 'setting', 'value']) ?? null;
}

/** Whether saving the preview's selection would change the stored default. */
export function canSaveDefault(next: FilterDefault | null | undefined, viz: VizOptions): boolean {
  if (next === undefined) return false;
  return !isEqual(next?.value ?? null, storedDefaultOf(viz));
}

/** A short text for the stored default: its values, its date mode, or how many tree items. */
export function defaultSummaryOf(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'None';
  if (Array.isArray(value)) return value.length > 0 ? value.map(String).join(', ') : 'None';
  if (typeof value !== 'object') return String(value);
  const record = value as JsonObject;
  if (typeof record['mode'] === 'string') {
    const dates = asArray(record['dates']).map(String);
    return record['mode'] === 'custom' && dates.length === 2 ? `${dates[0]} - ${dates[1]}` : record['mode'].replaceAll('_', ' ');
  }
  const keys = asArray(record['selectedKeys']);
  return keys.length > 0 ? `${keys.length} selected` : 'None';
}
