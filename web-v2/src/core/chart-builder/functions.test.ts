import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import { functionDataFromJson } from './FunctionData';
import { FieldKind, fieldKindOf, functionOf, sortsOf, tableColumnsOf } from './functions';

const field = (type: string, className = 'table_field') => ({ class_name: className, db_name: 'db', tbl_name: 'tbl', field_name: 'col', field_type: type });

const item = (overrides: JsonObject = {}) =>
  functionDataFromJson({ id: 1, name: 'col', function_family: 'Group By', function_type: '', field: field('string'), sorting: 'Unsorted', is_nested: false, ...overrides });

const control = {
  id: 77,
  default_table_columns: [{ name: 'Region', function: { class_name: 'group', field: field('string') }, is_dynamic_function: true, dynamic_function_id: 77 }]
};

describe('fieldKindOf', () => {
  it.each([
    [field('String'), FieldKind.Text],
    [field('datetime64'), FieldKind.Date],
    [field('int64'), FieldKind.Number],
    [field('bool'), FieldKind.Number],
    [field('double', 'expression_field'), FieldKind.Expression],
    [field('', 'chart_control_field'), FieldKind.Control]
  ])('%j is %s', (value, kind) => {
    expect(fieldKindOf(value)).toBe(kind);
  });
});

describe('functionOf', () => {
  it.each([
    ['Aggregation', 'Average', 'avg'],
    ['Aggregation', 'Count all', 'count'],
    ['Aggregation', 'Count distinct', 'count_distinct'],
    ['Aggregation', 'Expression', 'select_expression'],
    ['None', '', 'select'],
    ['Group By', '', 'group']
  ])('%s %s is %s', (family, type, className) => {
    expect(functionOf(item({ function_family: family, function_type: type }))).toEqual({ class_name: className, field: field('string') });
  });

  it('reads a text or number column as millis before a date function, Second and Nanosecond in their unit', () => {
    const dateFunction = (type: string, fieldType: string) =>
      functionOf(item({ function_family: 'Date histogram', function_type: type, field: field(fieldType) }))?.['scalar_function'];
    expect(dateFunction('Month of Year', 'datetime')).toEqual({ class_name: 'to_month' });
    expect(dateFunction('Month of Year', 'string')).toEqual({ class_name: 'to_month', inner_fn: { class_name: 'millis_to_datetime' } });
    expect(dateFunction('Day of', 'int64')).toEqual({ class_name: 'to_day_num', inner_fn: { class_name: 'millis_to_datetime' } });
    expect(dateFunction('Second', 'int64')).toEqual({ class_name: 'datetime_to_seconds', inner_fn: { class_name: 'seconds_to_datetime' } });
    expect(dateFunction('Nanosecond', 'string')).toEqual({ class_name: 'datetime_to_nanos', inner_fn: { class_name: 'nanos_to_datetime' } });
  });

  it('groups by the date as is without a date function', () => {
    expect(functionOf(item({ function_family: 'Date histogram', function_type: '', field: field('date') }))).toEqual({ class_name: 'group', field: field('date') });
  });

  it.each([
    ['Aggregation', 'First'],
    ['Date histogram', 'Week of Year'],
    ['Dynamic', '']
  ])('is undefined for %s %s, which v1 never built', (family, type) => {
    expect(functionOf(item({ function_family: family, function_type: type }))).toBeUndefined();
  });
});

describe('tableColumnsOf', () => {
  it('builds v1 table columns, display as column into is_horizontal_view', () => {
    expect(tableColumnsOf([item({ name: 'Region', display_as_column: true })])).toEqual([
      {
        name: 'Region',
        function: { class_name: 'group', field: field('string') },
        is_horizontal_view: true,
        is_collapse: false,
        is_calc_group_total: true,
        is_calc_min_max: false,
        is_dynamic_function: false
      }
    ]);
  });

  it("uses a chart control's own columns and leaves out items without a function", () => {
    const columns = tableColumnsOf([item({ function_family: 'Dynamic', dynamic_function: control }), item({ function_family: 'Aggregation', function_type: 'Last' })]);
    expect(columns).toEqual(control.default_table_columns);
  });
});

describe('sortsOf', () => {
  const sum = (sorting: string, extra: JsonObject = {}) => item({ id: 2, function_family: 'Aggregation', function_type: 'Sum', field: field('double'), sorting, ...extra });

  it('sorts by the Sorting zone, then by the sorted aggregations of the other zones', () => {
    const sorts = sortsOf({
      x_axis: [item({ sorting: 'Descending' })],
      y_axis: [sum('Unsorted'), sum('Descending')],
      sorting: [item({ sorting: 'Ascending' })]
    });
    expect(sorts).toEqual([
      { class_name: 'order_by', function: { class_name: 'group', field: field('string') }, order: 'ASC' },
      { class_name: 'order_by', function: { class_name: 'sum', field: field('double') }, order: 'DESC' }
    ]);
  });

  it('keeps top N only when it is on, as stored', () => {
    expect(sortsOf({ sorting: [sum('Ascending', { is_show_n_elements: true, num_elems_shown: '5' })] })[0]).toHaveProperty('num_elems_shown', '5');
    expect(sortsOf({ sorting: [sum('Ascending', { is_show_n_elements: false, num_elems_shown: 5 })] })[0]).not.toHaveProperty('num_elems_shown');
    expect(sortsOf({ sorting: [sum('Ascending', { is_show_n_elements: true, num_elems_shown: 0 })] })[0]).not.toHaveProperty('num_elems_shown');
  });

  it("sorts a chart control by its columns' functions", () => {
    expect(sortsOf({ sorting: [item({ function_family: 'Dynamic', sorting: 'Descending', dynamic_function: control })] })).toEqual([
      {
        class_name: 'order_by',
        function: {
          class_name: 'dynamic_function',
          dynamic_widget_id: 77,
          base_function: { class_name: 'group', field: field('string') },
          final_function: { class_name: 'group', field: field('string') }
        },
        order: 'DESC'
      }
    ]);
  });
});
