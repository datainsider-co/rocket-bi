import { asArray, asString, isRecord, withoutUndefined, type JsonObject } from '@/core/json/json';
import { isDateType, isTextType } from '@/core/schema/fieldTypes';
import { AggregationType, DateFunctionType, FunctionFamily, SortType, type FunctionData } from './FunctionData';

/** How a field is treated when it is dropped (v1 `Field.getDataType`): any other column type counts as a number. */
export const FieldKind = {
  Text: 'text',
  Number: 'number',
  Date: 'date',
  /** A measure (`expression_field`), always aggregated by its own expression. */
  Expression: 'expression',
  /** A chart control dropped as a field (`chart_control_field`). */
  Control: 'control'
} as const;

export type FieldKind = (typeof FieldKind)[keyof typeof FieldKind];

export function fieldKindOf(field: JsonObject): FieldKind {
  const className = asString(field['class_name']);
  if (className === 'expression_field') return FieldKind.Expression;
  if (className === 'chart_control_field') return FieldKind.Control;
  const type = asString(field['field_type']);
  if (isTextType(type)) return FieldKind.Text;
  if (isDateType(type)) return FieldKind.Date;
  return FieldKind.Number;
}

/**
 * Whether two fields are the same kind of column, so a zone item can keep its function when one replaces the other
 * (v1 `ChartUtils.isDiffFieldType`). Measures and chart controls never are.
 */
export function isSameFieldKind(first: JsonObject, second: JsonObject): boolean {
  const kind = fieldKindOf(first);
  return kind !== FieldKind.Expression && kind !== FieldKind.Control && kind === fieldKindOf(second);
}

const scalar = (className: string, innerFn?: JsonObject): JsonObject =>
  innerFn ? { class_name: className, inner_fn: innerFn } : { class_name: className };

const D = DateFunctionType;

/** Scalar function per date function (v1 `DateHistogramFunctionBuilder`). Week of Year has none, as in v1. */
const DATE_SCALARS: Readonly<Record<string, string>> = {
  [D.SecondOf]: 'to_second_num',
  [D.MinuteOf]: 'to_minute_num',
  [D.HourOf]: 'to_hour_num',
  [D.DayOf]: 'to_day_num',
  [D.WeekOf]: 'to_week_num',
  [D.MonthOf]: 'to_month_num',
  [D.QuarterOf]: 'to_quarter_num',
  [D.YearlyOf]: 'to_year_num',
  [D.HourOfDay]: 'to_hour',
  [D.DayOfWeek]: 'to_day_of_week',
  [D.DayOfMonth]: 'to_day_of_month',
  [D.DayOfYear]: 'to_day_of_year',
  [D.MonthOfYear]: 'to_month',
  [D.Year]: 'to_year',
  [D.QuarterOfYear]: 'to_quarter',
  [D.MinuteOfHour]: 'to_minute',
  [D.SecondOfMinute]: 'to_second',
  [D.Second]: 'datetime_to_seconds',
  [D.Millisecond]: 'datetime_to_millis',
  [D.Nanosecond]: 'datetime_to_nanos'
};

/**
 * A date function on a text or number column first reads the column as epoch millis; Second and Nanosecond read it in
 * their own unit (v1 `buildTextFieldBuilderForDateHistogram` / `buildNumberFieldBuilderForDateHistogram`).
 */
function dateScalarOf(dateFunction: string, kind: FieldKind): JsonObject | undefined {
  const className = DATE_SCALARS[dateFunction];
  if (!className) return undefined;
  if (kind !== FieldKind.Text && kind !== FieldKind.Number) return scalar(className);
  if (dateFunction === D.Second) return scalar(className, scalar('seconds_to_datetime'));
  if (dateFunction === D.Nanosecond) return scalar(className, scalar('nanos_to_datetime'));
  return scalar(className, scalar('millis_to_datetime'));
}

/** Backend function per aggregation (v1 `AggregationFunctionBuilder`). */
const AGGREGATIONS: Readonly<Record<string, string>> = {
  [AggregationType.Average]: 'avg',
  [AggregationType.Sum]: 'sum',
  [AggregationType.Maximum]: 'max',
  [AggregationType.Minimum]: 'min',
  [AggregationType.CountDistinct]: 'count_distinct',
  [AggregationType.CountAll]: 'count',
  [AggregationType.Expression]: 'select_expression'
};

/**
 * The backend function of a zone item (v1 `MainFunctionBuilder`), or `undefined` for one v1 could not build either
 * (a chart control, First, Last, Week of Year).
 */
export function functionOf(data: FunctionData): JsonObject | undefined {
  const { field } = data;
  switch (data.functionFamily) {
    case FunctionFamily.GroupBy:
      return { class_name: 'group', field };
    case FunctionFamily.DateHistogram: {
      if (!data.functionType) return { class_name: 'group', field };
      const scalarFunction = dateScalarOf(data.functionType, fieldKindOf(field));
      return scalarFunction && { class_name: 'group', field, scalar_function: scalarFunction };
    }
    case FunctionFamily.Aggregation: {
      const className = AGGREGATIONS[data.functionType ?? ''];
      return className ? { class_name: className, field } : undefined;
    }
    case FunctionFamily.None:
      return { class_name: 'select', field };
    default:
      return undefined;
  }
}

/** A chart control's own columns (`dynamic_function.default_table_columns`), as the control stored them. */
function controlColumnsOf(data: FunctionData): JsonObject[] {
  return asArray(data.dynamicFunction?.['default_table_columns']).filter(isRecord);
}

/**
 * The table columns of a zone (v1 `ChartUtils.buildTableColumnsFromFunctionData`): one per item, or a chart control's
 * columns. Items without a function are left out.
 */
export function tableColumnsOf(items: readonly FunctionData[]): JsonObject[] {
  return items.flatMap(data => {
    if (data.dynamicFunction) return controlColumnsOf(data);
    const func = functionOf(data);
    if (!func) return [];
    return [
      {
        name: data.name,
        function: func,
        is_horizontal_view: data.displayAsColumn ?? false,
        is_collapse: false,
        is_calc_group_total: true,
        is_calc_min_max: false,
        is_dynamic_function: false
      }
    ];
  });
}

const ORDERS: Readonly<Record<string, string>> = { [SortType.Ascending]: 'ASC', [SortType.Descending]: 'DESC' };

function orderBy(func: JsonObject, data: FunctionData, order: string): JsonObject {
  // v1 kept a falsy top N out (`numElemsShown || void 0`), and a string one as the string it was.
  const numElemsShown = data.isShowNElements && data.numElemsShown ? data.numElemsShown : undefined;
  return withoutUndefined<JsonObject>({ class_name: 'order_by', function: func, order, num_elems_shown: numElemsShown });
}

/** The sorts of one item (v1 `QuerySettingUtils.buildOrderBy`): none while it is unsorted. */
function orderBysOf(data: FunctionData): JsonObject[] {
  const order = ORDERS[data.sorting];
  if (!order) return [];
  if (data.dynamicFunction) {
    const controlId = data.dynamicFunction['id'];
    return controlColumnsOf(data)
      .map(column => column['function'])
      .filter(isRecord)
      .map(func => orderBy({ class_name: 'dynamic_function', dynamic_widget_id: controlId, base_function: func, final_function: func }, data, order));
  }
  const func = functionOf(data);
  return func ? [orderBy(func, data, order)] : [];
}

/**
 * A chart's sorts (v1 `QuerySettingUtils.buildListOrderBy`): the Sorting zone's items, then the sorted aggregations of
 * the other zones, in zone order.
 */
export function sortsOf(configs: Readonly<Record<string, readonly FunctionData[]>>): JsonObject[] {
  const sorting = configs['sorting'] ?? [];
  const aggregations = Object.entries(configs)
    .filter(([key]) => key !== 'sorting')
    .flatMap(([, items]) => items.filter(item => item.functionFamily === FunctionFamily.Aggregation));
  return [...sorting, ...aggregations].flatMap(orderBysOf);
}
