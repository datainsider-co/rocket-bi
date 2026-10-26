import { describe, expect, it } from 'vitest';
import {
  defaultCondition,
  FAMILY_CONDITIONS,
  filterConditionOf,
  FilterCondition,
  FilterInput,
  filterRequestOf,
  inputOf,
  isFilterCondition,
  type InternalFilter
} from './internalFilter';

const field = (type: string) => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'col', field_type: type });

const filter = (overrides: Partial<InternalFilter> = {}): InternalFilter => ({
  id: -1,
  name: 'Region',
  field: field('string'),
  condition: FilterCondition.In,
  values: ['Asia'],
  enabled: true,
  nested: false,
  ...overrides
});

describe('filterConditionOf', () => {
  it('builds in with the non-empty values', () => {
    expect(filterConditionOf(filter({ values: ['Asia', '', 'Europe'] }))).toEqual({
      class_name: 'in',
      possible_values: ['Asia', 'Europe'],
      field: field('string')
    });
  });

  it.each([
    [FilterCondition.Equal, 'int32', ['5'], { class_name: 'equal', value: '5' }],
    [FilterCondition.GreaterThanOrEqual, 'double', ['1.5'], { class_name: 'greater_than_or_equal', value: '1.5' }],
    [FilterCondition.Between, 'int64', ['1', '9'], { class_name: 'between', min: '1', max: '9' }],
    [FilterCondition.EarlierThan, 'datetime', ['2021-01-01 00:00:00'], { class_name: 'less_than', value: '2021-01-01 00:00:00' }],
    [FilterCondition.LaterThan, 'date', ['2021-01-01'], { class_name: 'greater_than', value: '2021-01-01' }],
    [FilterCondition.LastNDays, 'datetime', ['7'], { class_name: 'last_n_day', n_day: '7' }],
    [FilterCondition.CurrentMonth, 'datetime', [], { class_name: 'current_month' }],
    [FilterCondition.IsEmpty, 'string', [], { class_name: 'empty' }],
    [FilterCondition.NotLikeCaseInsensitive, 'string', ['a%'], { class_name: 'not_like_case_insensitive', value: 'a%' }]
  ])('%s on %s', (condition, type, values, expected) => {
    expect(filterConditionOf(filter({ condition, field: field(type), values }))).toEqual({ ...expected, field: field(type) });
  });

  it('reads the first element of a nested column', () => {
    expect(filterConditionOf(filter({ nested: true }))).toMatchObject({ scalar_function: { class_name: 'get_array_element', index: 1 } });
  });

  it.each([
    ['no values', { values: [] }],
    ['only empty values', { values: [''] }],
    ['one end of a range', { condition: FilterCondition.Between, field: field('int32'), values: ['1'] }],
    ['a condition the type lacks', { condition: FilterCondition.Like, field: field('int32') }],
    ['a type no filter supports', { field: field('bool') }]
  ])('is undefined with %s', (_case, overrides: Partial<InternalFilter>) => {
    expect(filterConditionOf(filter(overrides))).toBeUndefined();
  });
});

describe('filterRequestOf', () => {
  it('applies relatively under the filter id', () => {
    expect(filterRequestOf(filter())).toEqual({
      filter_id: -1,
      condition: expect.objectContaining({ class_name: 'in' }),
      is_apply_relatively: true,
      is_active: true
    });
  });

  it('is undefined while off or incomplete', () => {
    expect(filterRequestOf(filter({ enabled: false }))).toBeUndefined();
    expect(filterRequestOf(filter({ values: [] }))).toBeUndefined();
  });
});

describe('inputOf', () => {
  it.each([
    ['string', FilterCondition.In, FilterInput.MultiSelect],
    ['string', FilterCondition.IsNull, FilterInput.None],
    ['string', FilterCondition.Like, FilterInput.Text],
    ['number', FilterCondition.Between, FilterInput.NumberRange],
    ['date', FilterCondition.BetweenAndIncluding, FilterInput.DateRange],
    ['date', FilterCondition.EarlierThan, FilterInput.Date],
    ['date', FilterCondition.LastNYears, FilterInput.Text],
    ['date', FilterCondition.CurrentDay, FilterInput.None]
  ] as const)('%s %s → %s', (family, condition, input) => {
    expect(inputOf(family, condition)).toBe(input);
  });
});

describe('defaultCondition', () => {
  it('follows v1 per family', () => {
    expect(defaultCondition('number')).toBe(FilterCondition.Equal);
    expect(defaultCondition('date')).toBe(FilterCondition.Between);
    expect(defaultCondition('string')).toBe(FilterCondition.In);
    expect(defaultCondition(undefined)).toBe(FilterCondition.In);
  });

  it('is offered by its family', () => {
    for (const family of ['string', 'number', 'date'] as const) expect(FAMILY_CONDITIONS[family]).toContain(defaultCondition(family));
  });
});

describe('isFilterCondition', () => {
  it('knows v1 names only', () => {
    expect(isFilterCondition('last N days')).toBe(true);
    expect(isFilterCondition('last_n_day')).toBe(false);
    expect(isFilterCondition(undefined)).toBe(false);
  });
});
