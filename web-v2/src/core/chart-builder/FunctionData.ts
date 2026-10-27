import { asArray, asBoolean, asNumber, asRecord, asString, isRecord, withoutUndefined, type JsonObject } from '@/core/json/json';

/** v1 `FunctionFamilyTypes`: how a zone item turns its field into a function. */
export const FunctionFamily = {
  GroupBy: 'Group By',
  DateHistogram: 'Date histogram',
  Aggregation: 'Aggregation',
  /** A chart control dropped into a zone (`dynamic_function`). */
  Dynamic: 'Dynamic',
  None: 'None'
} as const;

export type FunctionFamily = (typeof FunctionFamily)[keyof typeof FunctionFamily];

/** v1 `AggregationFunctionTypes`. First and Last were listed in v1 but never built into a function. */
export const AggregationType = {
  Average: 'Average',
  Sum: 'Sum',
  Maximum: 'Maximum',
  Minimum: 'Minimum',
  CountDistinct: 'Count distinct',
  CountAll: 'Count all',
  First: 'First',
  Last: 'Last',
  Expression: 'Expression'
} as const;

/** v1 `DateFunctionTypes`. Week of Year was listed in v1 but never built into a function. */
export const DateFunctionType = {
  SecondOf: 'Second of',
  MinuteOf: 'Minute of',
  HourOf: 'Hour of',
  DayOf: 'Day of',
  WeekOf: 'Week of',
  MonthOf: 'Month of',
  QuarterOf: 'Quarter of',
  YearlyOf: 'Yearly of',
  HourOfDay: 'Hour of Day',
  DayOfWeek: 'Day of Week',
  DayOfMonth: 'Day of Month',
  DayOfYear: 'Day of Year',
  MonthOfYear: 'Month of Year',
  Year: 'Year',
  QuarterOfYear: 'Quarter of Year',
  MinuteOfHour: 'Minute of Hour',
  SecondOfMinute: 'Second of Minute',
  WeekOfYear: 'Week of Year',
  Second: 'Second',
  Millisecond: 'Millisecond',
  Nanosecond: 'Nanosecond'
} as const;

/** v1 `SortTypes`, the `sorting` of a zone item. */
export const SortType = {
  Unsorted: 'Unsorted',
  Ascending: 'Ascending',
  Descending: 'Descending'
} as const;

/**
 * One item of a builder zone (v1 `FunctionData`), as stored in `extra_data.configs`. `field` and `dynamicFunction` stay
 * the server's JSON. Optional keys are left out when v1 left them out: v1 reads any `dynamic_function`, even `{}`, as
 * a chart control, which is why this is not a deneric2 entity (it fills absent keys with defaults).
 */
export interface FunctionData {
  readonly id: number;
  /** Display name, the table column's `name`. */
  readonly name: string;
  readonly functionFamily: string;
  /** `''` for families without a type (Group By, None). */
  readonly functionType?: string;
  /** Backend field (`table_field`, `view_field`, `expression_field`, ...), snake_case as the server reads it. */
  readonly field: JsonObject;
  readonly tableName?: string;
  readonly columnName?: string;
  readonly displayAsColumn?: boolean;
  readonly isNested: boolean;
  readonly sorting: string;
  /** Top N. v1 stored a number, or a string once edited in its Config dialog (`"10"`), and sent it as it was. */
  readonly numElemsShown?: number | string | null;
  readonly isShowNElements?: boolean;
  /** The chart control (v1 `ChartControlData`), whose `default_table_columns` the item stands for. */
  readonly dynamicFunction?: JsonObject;
}

function optionalString(json: JsonObject, key: string): string | undefined {
  return typeof json[key] === 'string' ? json[key] : undefined;
}

function optionalBoolean(json: JsonObject, key: string): boolean | undefined {
  return typeof json[key] === 'boolean' ? json[key] : undefined;
}

function numElemsOf(value: unknown): number | string | null | undefined {
  return typeof value === 'number' || typeof value === 'string' || value === null ? value : undefined;
}

export function functionDataFromJson(value: unknown): FunctionData {
  const json = asRecord(value);
  return withoutUndefined<FunctionData>({
    id: asNumber(json['id']),
    name: asString(json['name']),
    functionFamily: asString(json['function_family']),
    functionType: optionalString(json, 'function_type'),
    field: asRecord(json['field']),
    tableName: optionalString(json, 'table_name'),
    columnName: optionalString(json, 'column_name'),
    displayAsColumn: optionalBoolean(json, 'display_as_column'),
    isNested: asBoolean(json['is_nested']),
    sorting: asString(json['sorting'], SortType.Unsorted),
    numElemsShown: numElemsOf(json['num_elems_shown']),
    isShowNElements: optionalBoolean(json, 'is_show_n_elements'),
    dynamicFunction: isRecord(json['dynamic_function']) ? json['dynamic_function'] : undefined
  });
}

export function functionDataToJson(data: FunctionData): JsonObject {
  return withoutUndefined<JsonObject>({
    id: data.id,
    name: data.name,
    function_family: data.functionFamily,
    function_type: data.functionType,
    field: data.field,
    table_name: data.tableName,
    column_name: data.columnName,
    display_as_column: data.displayAsColumn,
    is_nested: data.isNested,
    sorting: data.sorting,
    num_elems_shown: data.numElemsShown,
    is_show_n_elements: data.isShowNElements,
    dynamic_function: data.dynamicFunction
  });
}

export function functionDataListFromJson(value: unknown): FunctionData[] {
  return asArray(value).filter(isRecord).map(functionDataFromJson);
}
