import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import { conditionDataFromJson, newConditionData } from './ConditionData';
import { conditionOf, filtersOf } from './conditions';

const field = (type: string) => ({ class_name: 'table_field', db_name: 'db', tbl_name: 'tbl', field_name: 'col', field_type: type });

const condition = (overrides: JsonObject = {}) =>
  conditionDataFromJson({
    id: 1,
    group_id: 10,
    field: field('string'),
    is_nested: false,
    family_type: 'string',
    sub_type: 'in',
    all_values: ['a', 'b'],
    filter_mode_selected: 'range',
    current_option_selected: 'in',
    current_input_type: 'multi_select',
    ...overrides
  });

describe('conditionOf', () => {
  it('builds list conditions from all values and the others from the first two', () => {
    expect(conditionOf(condition())).toEqual({ class_name: 'in', possible_values: ['a', 'b'], field: field('string') });
    expect(conditionOf(condition({ family_type: 'number', sub_type: 'between', first_value: '1', second_value: '9', field: field('int32') }))).toEqual({
      class_name: 'between',
      min: '1',
      max: '9',
      field: field('int32')
    });
    expect(conditionOf(condition({ family_type: 'Date histogram', sub_type: 'last N days', first_value: '7', field: field('date') }))).toEqual({
      class_name: 'last_n_day',
      n_day: '7',
      field: field('date')
    });
  });

  it('is undefined while values are missing, or for a condition its family does not build', () => {
    expect(conditionOf(condition({ all_values: [] }))).toBeUndefined();
    expect(conditionOf(condition({ family_type: 'number', sub_type: 'between', first_value: '1' }))).toBeUndefined();
    expect(conditionOf(condition({ sub_type: 'greater than', first_value: '1' }))).toBeUndefined();
    expect(conditionOf(condition({ sub_type: 'unknown' }))).toBeUndefined();
  });

  it('reads the first element of a nested column', () => {
    expect(conditionOf(condition({ is_nested: true }))).toHaveProperty('scalar_function', { class_name: 'get_array_element', index: 1 });
  });

  it('builds a dynamic condition with placeholder values for a chart control, its value types as extra data', () => {
    expect(conditionOf(condition({ control_id: 31, all_values: ['equal'], is_nested: true }))).toEqual({
      class_name: 'dynamic_condition',
      dynamic_widget_id: 31,
      base_condition: { class_name: 'in', possible_values: ['0', '0'], field: field('string'), scalar_function: { class_name: 'get_array_element', index: 1 } },
      extra_data: { control_types: ['equal'] }
    });
  });
});

describe('newConditionData', () => {
  const input = (type: string) => ({ id: 3, groupId: 7, field: field(type), columnName: 'col', tableName: 'tbl' });

  it.each([
    ['string', 'string', 'in', 'multi_select'],
    ['int32', 'number', 'equal', 'text'],
    ['datetime', 'Date histogram', 'between', 'date_range']
  ])('starts a %s column as %s %s without values', (type, familyType, subType, inputType) => {
    expect(newConditionData(input(type))).toEqual({
      id: 3,
      groupId: 7,
      field: field(type),
      tableName: 'tbl',
      columnName: 'col',
      isNested: false,
      familyType,
      subType,
      firstValue: '',
      secondValue: '',
      allValues: [],
      currentInputType: inputType,
      filterModeSelected: 'range',
      currentOptionSelected: subType
    });
  });

  it('builds nothing until values are given', () => {
    expect(conditionOf(newConditionData(input('string')))).toBeUndefined();
  });
});

describe('filtersOf', () => {
  it('ands each group and leaves out the empty ones', () => {
    const filters = filtersOf({
      '10': [condition(), condition({ id: 2, sub_type: 'is not null' })],
      '20': [condition({ group_id: 20, all_values: [] })]
    });
    expect(filters).toEqual([
      {
        class_name: 'and',
        conditions: [
          { class_name: 'in', possible_values: ['a', 'b'], field: field('string') },
          { class_name: 'not_null', field: field('string') }
        ]
      }
    ]);
  });
});
