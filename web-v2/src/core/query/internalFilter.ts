import { asString, type JsonObject } from '@/core/json/json';
import { ConditionFamily, conditionFamilyOf } from '@/core/schema/fieldTypes';
import type { FilterRequestJson } from './QueryRequest';

/**
 * A dashboard-wide filter on one field (v1 `InternalFilter`): what drill through opens a dashboard with (`?filters=`)
 * and the header's filter bar shows. Unlike the filter widgets, it reaches charts as a `FilterRequest`, which the
 * server applies to every chart on the same table or one related to it.
 */
export interface InternalFilter {
  /** Unique among the dashboard's filters; the `filter_id` of its request. */
  readonly id: number;
  readonly name: string;
  /** Backend field (`table_field`, `view_field`), snake_case as the server reads it. */
  readonly field: JsonObject;
  readonly condition: FilterCondition;
  readonly values: readonly string[];
  readonly enabled: boolean;
  /** A column of a nested table: conditions read its first element (v1 `GetArrayElement`). */
  readonly nested: boolean;
}

/** v1's condition names (`StringConditionTypes`, `NumberConditionTypes`, `DateHistogramConditionTypes`). */
export const FilterCondition = {
  In: 'in',
  NotIn: 'not in',
  Equal: 'equal',
  NotEqual: 'not equal',
  IsNull: 'is null',
  NotNull: 'is not null',
  IsEmpty: 'is empty',
  NotEmpty: 'is not empty',
  Like: 'like',
  NotLike: 'is not like',
  MatchesRegex: 'matches regex',
  LikeCaseInsensitive: 'like (case insensitive)',
  NotLikeCaseInsensitive: 'not like (case insensitive)',
  GreaterThan: 'greater than',
  GreaterThanOrEqual: 'greater than or equal',
  LessThan: 'less than',
  LessThanOrEqual: 'less than or equal',
  Between: 'between',
  BetweenAndIncluding: 'between and including',
  EarlierThan: 'earlier than',
  LaterThan: 'later than',
  LastNMinutes: 'last N minutes',
  LastNHours: 'last N hours',
  LastNDays: 'last N days',
  LastNWeeks: 'last N weeks',
  LastNMonths: 'last N months',
  LastNQuarters: 'last N quarters',
  LastNYears: 'last N years',
  CurrentDay: 'current day',
  CurrentWeek: 'current week',
  CurrentMonth: 'current month',
  CurrentQuarter: 'current quarter',
  CurrentYear: 'current year'
} as const;

export type FilterCondition = (typeof FilterCondition)[keyof typeof FilterCondition];

/** What a condition takes as values (v1 `InputType`, same strings). */
export const FilterInput = {
  None: 'none',
  Text: 'text',
  MultiSelect: 'multi_select',
  NumberRange: 'number_range',
  Date: 'date_time',
  DateRange: 'date_range'
} as const;

export type FilterInput = (typeof FilterInput)[keyof typeof FilterInput];

const C = FilterCondition;

/**
 * The conditions each family offers, in v1's menu order (`FilterConstants.*_SELECTION_OPTIONS`, `NumberFilter`,
 * `DateHistogramFilter`). v1 split them into a Range and a Selection mode; here they are one list.
 */
export const FAMILY_CONDITIONS: Readonly<Record<ConditionFamily, readonly FilterCondition[]>> = {
  [ConditionFamily.String]: [
    C.In,
    C.NotIn,
    C.Equal,
    C.NotEqual,
    C.IsEmpty,
    C.NotEmpty,
    C.IsNull,
    C.NotNull,
    C.MatchesRegex,
    C.Like,
    C.NotLike,
    C.LikeCaseInsensitive,
    C.NotLikeCaseInsensitive
  ],
  [ConditionFamily.Number]: [
    C.Equal,
    C.NotEqual,
    C.GreaterThan,
    C.Between,
    C.BetweenAndIncluding,
    C.GreaterThanOrEqual,
    C.LessThan,
    C.LessThanOrEqual,
    C.In,
    C.NotIn,
    C.IsNull,
    C.NotNull
  ],
  [ConditionFamily.Date]: [
    C.Between,
    C.BetweenAndIncluding,
    C.EarlierThan,
    C.LaterThan,
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
    C.CurrentYear,
    C.In,
    C.NotIn,
    C.IsNull,
    C.NotNull
  ]
};

type Build = (values: readonly string[]) => JsonObject | undefined;

const single =
  (className: string, key = 'value'): Build =>
  ([value]) =>
    value ? { class_name: className, [key]: value } : undefined;
const list =
  (className: string): Build =>
  values => {
    const filled = values.filter(value => value !== '');
    return filled.length > 0 ? { class_name: className, possible_values: filled } : undefined;
  };
const range =
  (className: string): Build =>
  ([min, max]) =>
    min && max ? { class_name: className, min, max } : undefined;
const bare =
  (className: string): Build =>
  () => ({ class_name: className });

/** Backend condition per v1 name (v1 `StringConditionBuilder`, `NumberConditionBuilder`, `DateHistogramConditionBuilder`). */
const BUILDERS: Readonly<Record<FilterCondition, Build>> = {
  [C.In]: list('in'),
  [C.NotIn]: list('not_in'),
  [C.Equal]: single('equal'),
  [C.NotEqual]: single('not_equal'),
  [C.IsNull]: bare('null'),
  [C.NotNull]: bare('not_null'),
  [C.IsEmpty]: bare('empty'),
  [C.NotEmpty]: bare('not_empty'),
  [C.Like]: single('like'),
  [C.NotLike]: single('not_like'),
  [C.MatchesRegex]: single('match_regex'),
  [C.LikeCaseInsensitive]: single('like_case_insensitive'),
  [C.NotLikeCaseInsensitive]: single('not_like_case_insensitive'),
  [C.GreaterThan]: single('greater_than'),
  [C.GreaterThanOrEqual]: single('greater_than_or_equal'),
  [C.LessThan]: single('less_than'),
  [C.LessThanOrEqual]: single('less_than_or_equal'),
  [C.Between]: range('between'),
  [C.BetweenAndIncluding]: range('between_and_including'),
  [C.EarlierThan]: single('less_than'),
  [C.LaterThan]: single('greater_than'),
  [C.LastNMinutes]: single('last_n_minute', 'n_minute'),
  [C.LastNHours]: single('last_n_hour', 'n_hour'),
  [C.LastNDays]: single('last_n_day', 'n_day'),
  [C.LastNWeeks]: single('last_n_week', 'n_week'),
  [C.LastNMonths]: single('last_n_month', 'n_month'),
  [C.LastNQuarters]: single('last_n_quarter', 'n_quarter'),
  [C.LastNYears]: single('last_n_year', 'n_year'),
  [C.CurrentDay]: bare('current_day'),
  [C.CurrentWeek]: bare('current_week'),
  [C.CurrentMonth]: bare('current_month'),
  [C.CurrentQuarter]: bare('current_quarter'),
  [C.CurrentYear]: bare('current_year')
};

const NO_INPUT = new Set<FilterCondition>([
  C.IsNull,
  C.NotNull,
  C.IsEmpty,
  C.NotEmpty,
  C.CurrentDay,
  C.CurrentWeek,
  C.CurrentMonth,
  C.CurrentQuarter,
  C.CurrentYear
]);

export function isFilterCondition(value: unknown): value is FilterCondition {
  return typeof value === 'string' && Object.hasOwn(BUILDERS, value);
}

export function familyOf(filter: Pick<InternalFilter, 'field'>): ConditionFamily | undefined {
  return conditionFamilyOf(asString(filter.field['field_type']));
}

/** The values a condition takes, as v1 asked for them. */
export function inputOf(family: ConditionFamily | undefined, condition: FilterCondition): FilterInput {
  if (NO_INPUT.has(condition)) return FilterInput.None;
  if (condition === C.In || condition === C.NotIn) return FilterInput.MultiSelect;
  if (condition === C.Between || condition === C.BetweenAndIncluding) {
    return family === ConditionFamily.Date ? FilterInput.DateRange : FilterInput.NumberRange;
  }
  if (condition === C.EarlierThan || condition === C.LaterThan) return FilterInput.Date;
  return FilterInput.Text;
}

/** What a filter starts with, and falls back to once its values are cleared (v1 `FilterConstants.DEFAULT_*`). */
export function defaultCondition(family: ConditionFamily | undefined): FilterCondition {
  if (family === ConditionFamily.Number) return C.Equal;
  if (family === ConditionFamily.Date) return C.Between;
  return C.In;
}

/**
 * The filter as a backend condition (v1 `InternalFilter.toConditionData` + `DiConditionResolver`), or `undefined`
 * while it lacks the values its condition needs, or the field's type has no such condition.
 */
export function filterConditionOf(filter: InternalFilter): JsonObject | undefined {
  const family = familyOf(filter);
  if (!family || !FAMILY_CONDITIONS[family].includes(filter.condition)) return undefined;
  const body = BUILDERS[filter.condition](filter.values);
  if (!body) return undefined;
  return {
    ...body,
    field: filter.field,
    ...(filter.nested && { scalar_function: { class_name: 'get_array_element', index: 1 } })
  };
}

/** The request a filter adds to every chart it applies to; none while it is off or incomplete. */
export function filterRequestOf(filter: InternalFilter): FilterRequestJson | undefined {
  const condition = filter.enabled ? filterConditionOf(filter) : undefined;
  return condition && { filter_id: filter.id, condition, is_apply_relatively: true, is_active: true };
}
