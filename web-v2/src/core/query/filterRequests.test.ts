import { describe, expect, it } from 'vitest';
import fixture from '@/core/dashboard/filters.fixture.json';
import type { JsonObject } from '@/core/json/json';
import { equalCondition, filterColumnOf, inCondition, innerFilterRequest } from './filterRequests';
import { canQuerySetting } from './QueryRequest';

const settings = new Map(fixture.widgets.map(widget => [widget.id, (widget as { setting?: JsonObject }).setting ?? {}]));
const setting = (id: number) => settings.get(id) ?? {};
const field = { class_name: 'table_field', field_name: 'region' };

describe('filterColumnOf', () => {
  it('reads value, then the first of values', () => {
    expect(filterColumnOf({ value: { name: 'a' }, values: [{ name: 'b' }] })).toEqual({ name: 'a' });
    expect(filterColumnOf({ values: [{ name: 'b' }] })).toEqual({ name: 'b' });
    expect(filterColumnOf({ values: [] })).toBeUndefined();
  });
});

describe('inCondition', () => {
  it('keeps the scalar function', () => {
    const scalar = { class_name: 'to_year' };
    expect(inCondition({ function: { field, scalar_function: scalar } }, ['2020'])).toEqual({
      class_name: 'in',
      field,
      possible_values: ['2020'],
      scalar_function: scalar
    });
  });

  it('needs a field', () => {
    expect(inCondition({ function: { class_name: 'count_all' } }, ['a'])).toBeUndefined();
    expect(inCondition({}, ['a'])).toBeUndefined();
  });
});

describe('innerFilterRequest', () => {
  const filter = { value: { function: { field } } };

  it('filters the chart by the picked values', () => {
    expect(innerFilterRequest(22, filter, ['Asia'])).toEqual({
      filter_id: 22,
      condition: { class_name: 'in', field, possible_values: ['Asia'] },
      is_apply_relatively: true,
      is_active: true
    });
  });

  it('is nothing for Show all or a filter without column', () => {
    expect(innerFilterRequest(22, filter, [])).toBeUndefined();
    expect(innerFilterRequest(22, {}, ['Asia'])).toBeUndefined();
  });
});

describe('canQuerySetting', () => {
  it.each([
    [13, 'tab filter', true],
    [14, 'slicer (min and max)', true],
    [16, 'input (one column)', false],
    [17, 'tree filter', true],
    [18, 'date select (min and max)', true],
    [19, 'tab control (function)', false],
    [20, 'series chart', true],
    [23, 'parameter input (no column)', false]
  ])('widget %i, %s: %s', (id, _, expected) => {
    expect(canQuerySetting(setting(id))).toBe(expected);
  });
});

describe('equalCondition', () => {
  it('compares the column field, with its scalar function', () => {
    const scalar = { class_name: 'to_year' };
    expect(equalCondition({ function: { field, scalar_function: scalar } }, '2020')).toEqual({ class_name: 'equal', field, value: '2020', scalar_function: scalar });
    expect(equalCondition({ function: { field } }, 'a')).toEqual({ class_name: 'equal', field, value: 'a' });
    expect(equalCondition(undefined, 'a')).toBeUndefined();
  });
});
