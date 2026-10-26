import { asArray, asNumber, asString, isRecord, type JsonObject } from '@/core/json/json';

/**
 * Dashboard controls (v1 `ValueController` / `DynamicValueCondition`). Every chart can drive others: a filter's
 * selection, a pie's clicked slice, the main date range. A chart opts in per condition in ChartBuilder by storing a
 * `dynamic_condition` that names the control (`dynamic_widget_id`) and which of its values to use (`control_types`).
 * At query time the condition gets a `final_condition` built from those values; without one the server ignores it.
 *
 * v1 did this by mutating every chart's query setting in a store. Here it is a pure transform of the stored setting,
 * so the request (and the query key) of a chart changes only when a control it depends on changes.
 */

/** v1 `ValueControlType`. */
export const ValueControlType = {
  SelectedValue: 'selected_value',
  MinValue: 'min_value',
  MaxValue: 'max_value'
} as const;

export type ValueControlType = (typeof ValueControlType)[keyof typeof ValueControlType];

/** What one control currently offers, per type. `{}` means "cleared": conditions on it apply nothing. */
export type ControlValues = Readonly<Partial<Record<ValueControlType, readonly string[]>>>;

/** Control widget id → its values. A control without an entry was never set; its conditions stay as stored. */
export type ControlValueMap = Readonly<Record<number, ControlValues>>;

const DYNAMIC_CONDITION = 'dynamic_condition';

/** Conditions holding other conditions (v1 `NestedCondition`): `and`, `or`. */
function childConditions(condition: JsonObject): unknown[] | undefined {
  return Array.isArray(condition['conditions']) ? condition['conditions'] : undefined;
}

function visitDynamic(conditions: readonly unknown[], visit: (condition: JsonObject) => void): void {
  for (const condition of conditions) {
    if (!isRecord(condition)) continue;
    if (condition['class_name'] === DYNAMIC_CONDITION) visit(condition);
    const children = childConditions(condition);
    if (children) visitDynamic(children, visit);
  }
}

/** Ids of the controls a query setting's filters depend on (v1 `canApplyValueControl`). */
export function referencedControlIds(setting: JsonObject): Set<number> {
  const ids = new Set<number>();
  visitDynamic(asArray(setting['filters']), condition => ids.add(asNumber(condition['dynamic_widget_id'], Number.NaN)));
  ids.delete(Number.NaN);
  return ids;
}

/** Field holding a single value, per condition class (v1 `ValueCondition.setValues`). */
const SINGLE_VALUE_FIELD: Readonly<Record<string, string>> = {
  equal: 'value',
  not_equal: 'value',
  greater_than: 'value',
  greater_than_or_equal: 'value',
  less_than: 'value',
  less_than_or_equal: 'value',
  match_regex: 'value',
  like: 'value',
  not_like: 'value',
  like_case_insensitive: 'value',
  not_like_case_insensitive: 'value',
  last_n_minute: 'n_minute',
  last_n_hour: 'n_hour',
  last_n_day: 'n_day',
  last_n_week: 'n_week',
  last_n_month: 'n_month',
  last_n_quarter: 'n_quarter',
  last_n_year: 'n_year'
};

const LIST_CLASSES = new Set(['in', 'not_in']);
const RANGE_CLASSES = new Set(['between', 'between_and_including']);
const NO_VALUE_CLASSES = new Set(['current_day', 'current_week', 'current_month', 'current_quarter', 'current_year']);

/**
 * `base` with `values` in it, or `undefined` when the values don't fit (v1 threw for most of these, which broke the
 * whole chart; here the condition just doesn't apply).
 */
export function withConditionValues(base: JsonObject, values: readonly string[]): JsonObject | undefined {
  if (values.length === 0) return undefined;
  const className = asString(base['class_name']);
  if (LIST_CLASSES.has(className)) return { ...base, possible_values: [...values] };
  if (RANGE_CLASSES.has(className)) return values.length >= 2 ? { ...base, min: values[0], max: values[1] } : undefined;
  if (NO_VALUE_CLASSES.has(className)) return { ...base };
  const field = SINGLE_VALUE_FIELD[className];
  return field ? { ...base, [field]: values[0] } : undefined;
}

function controlTypesOf(condition: JsonObject): string[] {
  const extraData = isRecord(condition['extra_data']) ? condition['extra_data'] : {};
  return asArray(extraData['control_types']).filter((type): type is string => typeof type === 'string');
}

function applyToConditions(conditions: readonly unknown[], controls: ControlValueMap): unknown[] {
  return conditions.map(condition => {
    if (!isRecord(condition)) return condition;
    if (condition['class_name'] === DYNAMIC_CONDITION) {
      const controlId = asNumber(condition['dynamic_widget_id'], Number.NaN);
      const values = controls[controlId];
      if (!values) return condition;
      const selected = controlTypesOf(condition).flatMap(type => values[type as ValueControlType] ?? []);
      const base = isRecord(condition['base_condition']) ? condition['base_condition'] : undefined;
      const { final_condition: _previous, ...rest } = condition;
      const final = base ? withConditionValues(base, selected) : undefined;
      return final ? { ...rest, final_condition: final } : rest;
    }
    const children = childConditions(condition);
    return children ? { ...condition, conditions: applyToConditions(children, controls) } : condition;
  });
}

/**
 * The setting with the given controls' values applied to its dynamic conditions (v1 `applyDynamicFilters`). Pass only
 * the controls that matter, so unrelated changes leave the result equal.
 */
export function applyControlValues(setting: JsonObject, controls: ControlValueMap): JsonObject {
  if (Object.keys(controls).length === 0 || !Array.isArray(setting['filters'])) return setting;
  return { ...setting, filters: applyToConditions(setting['filters'], controls) };
}

/** The entries of `controls` that `setting` depends on, the chart itself excluded (v1 skips its own id). */
export function controlsFor(setting: JsonObject, selfId: number, controls: ControlValueMap): ControlValueMap {
  const picked: Record<number, ControlValues> = {};
  for (const id of referencedControlIds(setting)) {
    const values = controls[id];
    if (id !== selfId && values) picked[id] = values;
  }
  return picked;
}
