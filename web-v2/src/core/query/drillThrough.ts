import { asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { ConditionFamily, conditionFamilyOf } from '@/core/schema/fieldTypes';
import { drillColumnOf } from './drilldown';
import { FilterCondition, type InternalFilter } from './internalFilter';

/**
 * Drill through (v1 `DrillThroughResolver`): a clicked value becomes a filter on the column it came from, and another
 * dashboard opens with it and the current dashboard's filters (`?filters=`). The server lists the dashboards that
 * have a filter widget on one of those fields (`dashboards/list_drill_through`).
 */

/** v1 disabled drill through for tab filters only. */
export function canDrillThrough(setting: JsonObject): boolean {
  return setting['class_name'] !== 'tab_filter_chart_setting';
}

function columnField(column: unknown): JsonObject | undefined {
  const field = getPath(column, ['function', 'field']);
  return isRecord(field) ? field : undefined;
}

function filterOn(column: unknown, condition: FilterCondition, value: string): InternalFilter | undefined {
  const field = columnField(column);
  if (!field) return undefined;
  return {
    id: 0,
    name: asString(getPath(column, ['name'])),
    field,
    condition,
    values: [value],
    enabled: true,
    nested: asString(field['field_name']).includes('.')
  };
}

/**
 * The clicked value on its column (v1 `DefaultDrillThroughHandler.configFilterValue`): `equal` for numbers, `in` for
 * text. None for dates: a chart groups them by a date function the filter can't carry, and v1's filter (`in` on the
 * label) matched no row.
 */
function valueFilter(column: JsonObject | undefined, value: string): InternalFilter[] {
  const family = conditionFamilyOf(asString(getPath(columnField(column), ['field_type'])));
  const condition = family === ConditionFamily.Number ? FilterCondition.Equal : family === ConditionFamily.String ? FilterCondition.In : undefined;
  const filter = condition && filterOn(column, condition, value);
  return filter ? [filter] : [];
}

/** A histogram bin, given as `[min, max]` (v1 `HistogramDrillThroughHandler`). */
function binFilters(column: unknown, value: string): InternalFilter[] {
  let bin: unknown;
  try {
    bin = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(bin) || bin.length < 2) return [];
  const min = filterOn(column, FilterCondition.GreaterThanOrEqual, String(bin[0]));
  const max = filterOn(column, FilterCondition.LessThanOrEqual, String(bin[1]));
  return min && max ? [min, max] : [];
}

/** Filters for a clicked value; ids are left at 0 for the caller to number. */
export function drillThroughFilters(setting: JsonObject, value: string): InternalFilter[] {
  switch (setting['class_name']) {
    case 'bubble_chart_setting':
      return [];
    case 'histogram_chart_setting':
      return binFilters(setting['value'], value);
    case 'heat_map_chart_setting':
      return valueFilter(isRecord(setting['x_axis']) ? setting['x_axis'] : undefined, value);
    default:
      return valueFilter(drillColumnOf(setting), value);
  }
}
