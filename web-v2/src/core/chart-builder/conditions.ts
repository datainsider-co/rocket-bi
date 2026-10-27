import type { JsonObject } from '@/core/json/json';
import { conditionBody, FilterCondition, isFilterCondition } from '@/core/query/internalFilter';
import { ConditionFamilyType, type ConditionData } from './ConditionData';

const C = FilterCondition;

/** The conditions each family builds (v1 `StringConditionBuilder`, `NumberConditionBuilder`, `DateHistogramConditionBuilder`). */
const FAMILY_BUILDS: Readonly<Record<string, ReadonlySet<FilterCondition>>> = {
  [ConditionFamilyType.String]: new Set([
    C.In,
    C.NotIn,
    C.Equal,
    C.NotEqual,
    C.IsNull,
    C.NotNull,
    C.IsEmpty,
    C.NotEmpty,
    C.Like,
    C.NotLike,
    C.MatchesRegex,
    C.LikeCaseInsensitive,
    C.NotLikeCaseInsensitive
  ]),
  [ConditionFamilyType.Number]: new Set([
    C.In,
    C.NotIn,
    C.Equal,
    C.NotEqual,
    C.IsNull,
    C.NotNull,
    C.GreaterThan,
    C.GreaterThanOrEqual,
    C.LessThan,
    C.LessThanOrEqual,
    C.Between,
    C.BetweenAndIncluding
  ]),
  [ConditionFamilyType.Date]: new Set([
    C.In,
    C.NotIn,
    C.Equal,
    C.NotEqual,
    C.IsNull,
    C.NotNull,
    C.EarlierThan,
    C.LaterThan,
    C.Between,
    C.BetweenAndIncluding,
    C.LastNMinutes,
    C.LastNHours,
    C.LastNDays,
    C.LastNWeeks,
    C.LastNMonths,
    C.LastNQuarters,
    C.LastNYears,
    C.CurrentDay,
    C.CurrentWeek,
    C.CurrentMonth,
    C.CurrentQuarter,
    C.CurrentYear
  ])
};

const NESTED_SCALAR = { class_name: 'get_array_element', index: 1 };

/** `in` and `not in` read every value, the others the first two. */
function valuesOf(condition: FilterCondition, data: Pick<ConditionData, 'firstValue' | 'secondValue' | 'allValues'>): readonly string[] {
  return condition === C.In || condition === C.NotIn ? data.allValues : [data.firstValue ?? '', data.secondValue ?? ''];
}

function fieldConditionOf(data: ConditionData, values: Pick<ConditionData, 'firstValue' | 'secondValue' | 'allValues'>): JsonObject | undefined {
  const condition = data.subType;
  if (!isFilterCondition(condition) || !FAMILY_BUILDS[data.familyType]?.has(condition)) return undefined;
  const body = conditionBody(condition, valuesOf(condition, values));
  return body && { ...body, field: data.field, ...(data.isNested && { scalar_function: NESTED_SCALAR }) };
}

/**
 * One condition of the Filter zone as a backend condition (v1 `DiConditionResolver.buildCondition`), or `undefined`
 * while it lacks its values. A condition on a chart control is a `dynamic_condition`: its base condition holds
 * placeholder values (v1 `DynamicConditionBuilder`) until the control fills `final_condition` at query time. v1 lost
 * the nested column's `get_array_element` on those; v2 keeps it on the base condition.
 */
export function conditionOf(data: ConditionData): JsonObject | undefined {
  if (data.controlId === undefined) return fieldConditionOf(data, data);
  const base = fieldConditionOf(data, { firstValue: '0', secondValue: '0', allValues: ['0', '0'] });
  return (
    base && {
      class_name: 'dynamic_condition',
      dynamic_widget_id: data.controlId,
      base_condition: base,
      extra_data: { control_types: data.allValues }
    }
  );
}

/** A chart's filters (v1 `DiConditionResolver.buildConditions`): one `and` per group, empty groups left out. */
export function filtersOf(groups: Readonly<Record<string, readonly ConditionData[]>>): JsonObject[] {
  return Object.values(groups).flatMap(group => {
    const conditions = group.map(conditionOf).filter(condition => condition !== undefined);
    return conditions.length > 0 ? [{ class_name: 'and', conditions }] : [];
  });
}
