import { camelCase } from 'lodash-es';
import { asArray, asNumber, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';

/**
 * Tab controls (v1 `FunctionController`, `DashboardControllerStore.replaceDynamicFunction`): a tab filter with several
 * columns lets the viewer pick which of them other charts show. A chart opts in per column in ChartBuilder by storing
 * `dynamic_function_id` (the control's id) on it; at query time the column is replaced by the picked ones. Sorts on
 * such a column are stored as a `dynamic_function` whose `final_function` gets the picked column's function.
 *
 * v1 had one replace method per query setting class. Here one walk over the setting replaces every column that names a
 * control, wherever the class keeps it.
 */

const TAB_CONTROL_SETTING = 'tab_control_chart_setting';
const TAB_FILTER_VIZ = 'tab_filter_chart_setting';
const DYNAMIC_FUNCTION = 'dynamic_function';

/** Picked columns per control id. */
export type FunctionSelection = Readonly<Record<number, readonly JsonObject[]>>;

export function functionColumns(controlSetting: JsonObject): JsonObject[] {
  return asArray(controlSetting['values']).filter(isRecord);
}

/** A tab filter with more than one column picks columns instead of filtering (v1 `isEnableFunctionControl`). */
export function isFunctionControl(setting: JsonObject): boolean {
  return (
    setting['class_name'] === TAB_CONTROL_SETTING &&
    getPath(setting, ['options', 'class_name']) === TAB_FILTER_VIZ &&
    functionColumns(setting).length > 1
  );
}

/** The option key of a column, as v1 stored it in the control's default value: `<camelCase name>_<index>`. */
export function functionKey(column: JsonObject, index: number): string {
  return `${camelCase(asString(column['name']))}_${index}`;
}

function functionIndex(key: string): number {
  return Number(key.slice(key.lastIndexOf('_') + 1));
}

/** The columns behind the picked keys, marked as controlled by `controlId` so later replacements still find them. */
export function selectedColumns(controlSetting: JsonObject, keys: readonly string[], controlId: number): JsonObject[] {
  const columns = functionColumns(controlSetting);
  return keys.flatMap(key => {
    const column = columns[functionIndex(key)];
    return column ? [{ ...column, is_dynamic_function: true, dynamic_function_id: controlId }] : [];
  });
}

function controlIdOf(value: unknown): number | undefined {
  return isRecord(value) && typeof value['dynamic_function_id'] === 'number' ? value['dynamic_function_id'] : undefined;
}

function sortControlId(sort: unknown): number | undefined {
  const fn = isRecord(sort) ? sort['function'] : undefined;
  return isRecord(fn) && fn['class_name'] === DYNAMIC_FUNCTION ? asNumber(fn['dynamic_widget_id'], Number.NaN) : undefined;
}

/** Keys holding no columns; skipped by the walk. */
const SKIPPED_KEYS = new Set(['options', 'filters', 'sorts', 'sql_views', 'parameters']);

function collectIds(value: unknown, ids: Set<number>): void {
  if (Array.isArray(value)) {
    value.forEach(item => collectIds(item, ids));
    return;
  }
  if (!isRecord(value)) return;
  const id = controlIdOf(value);
  if (id !== undefined) ids.add(id);
  for (const [key, item] of Object.entries(value)) if (!SKIPPED_KEYS.has(key)) collectIds(item, ids);
}

/** Ids of the tab controls whose picks change this setting (v1 `canControlFunction`). */
export function referencedFunctionIds(setting: JsonObject): Set<number> {
  const ids = new Set<number>();
  collectIds(setting, ids);
  for (const sort of asArray(setting['sorts'])) {
    const id = sortControlId(sort);
    if (id !== undefined && !Number.isNaN(id)) ids.add(id);
  }
  return ids;
}

function replaceIn(value: unknown, functions: FunctionSelection): unknown {
  if (Array.isArray(value)) {
    // v1 `replaceDynamicFunctions`: the first column of a control becomes all the picked ones, later ones go away.
    const replaced = new Set<number>();
    return value.flatMap((item): unknown[] => {
      const id = controlIdOf(item);
      const picked = id === undefined ? undefined : functions[id];
      if (id === undefined || !picked?.length) return [replaceIn(item, functions)];
      if (replaced.has(id)) return [];
      replaced.add(id);
      return [...picked];
    });
  }
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (SKIPPED_KEYS.has(key)) return [key, item];
      const id = controlIdOf(item);
      const first = id === undefined ? undefined : functions[id]?.[0];
      return [key, first ?? replaceIn(item, functions)];
    })
  );
}

function replaceSorts(sorts: readonly unknown[], functions: FunctionSelection): unknown[] {
  const replaced = new Set<number>();
  return sorts.flatMap(sort => {
    const id = sortControlId(sort);
    const picked = id === undefined ? undefined : functions[id];
    if (id === undefined || !picked?.length || !isRecord(sort)) return [sort];
    if (replaced.has(id)) return [];
    replaced.add(id);
    const fn = sort['function'] as JsonObject;
    return picked.map(column => ({ ...sort, function: { ...fn, final_function: column['function'] } }));
  });
}

/** The setting with the picked columns in place of the controlled ones (v1 `applyDynamicFunctions` + sorts). */
export function applyDynamicFunctions(setting: JsonObject, functions: FunctionSelection): JsonObject {
  if (Object.keys(functions).length === 0) return setting;
  const next = replaceIn(setting, functions) as JsonObject;
  return Array.isArray(setting['sorts']) ? { ...next, sorts: replaceSorts(setting['sorts'], functions) } : next;
}
