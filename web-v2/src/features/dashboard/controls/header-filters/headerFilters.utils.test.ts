import { describe, expect, it } from 'vitest';
import { FilterCondition, type InternalFilter } from '@/core/query/internalFilter';
import { appliedFilter, conditionOptions, describeFilter, filterChips, withCondition, withoutChip } from './headerFilters.utils';

const field = (type: string) => ({ class_name: 'table_field', db_name: 'db', tbl_name: 'sales', field_name: 'col', field_type: type });
const filter = (overrides: Partial<InternalFilter> = {}): InternalFilter => ({
  id: -1,
  name: 'Region',
  field: field('string'),
  condition: FilterCondition.In,
  values: ['Asia', 'Europe'],
  enabled: true,
  nested: false,
  ...overrides
});
const number = (condition: FilterCondition, values: string[]) => filter({ field: field('int32'), condition, values });

describe('filterChips', () => {
  it.each([
    ['each listed value', filter(), ['Asia', 'Europe']],
    ['the condition without values', filter({ condition: FilterCondition.IsNull, values: [] }), ['is null']],
    ['a range as one chip', number(FilterCondition.Between, ['1', '9']), ['1 - 9']],
    ['the first value', number(FilterCondition.Equal, ['5', 'x']), ['5']],
    ['nothing without values', number(FilterCondition.Equal, []), []],
    ['nothing for an empty range', number(FilterCondition.Between, []), []]
  ])('shows %s', (_case, item, chips) => {
    expect(filterChips(item)).toEqual(chips);
  });
});

describe('withoutChip', () => {
  it('drops one value of a list', () => {
    expect(withoutChip(filter(), 0).values).toEqual(['Europe']);
  });

  it('clears the value of other conditions', () => {
    expect(withoutChip(number(FilterCondition.Between, ['1', '9']), 0)).toMatchObject({ values: [], condition: FilterCondition.Between });
  });

  it('puts a condition without values back to the default', () => {
    expect(withoutChip(number(FilterCondition.IsNull, []), 0).condition).toBe(FilterCondition.Equal);
  });
});

describe('describeFilter', () => {
  it('names the condition and its values', () => {
    expect(describeFilter(filter())).toBe('in Asia, Europe');
    expect(describeFilter(filter({ condition: FilterCondition.NotNull, values: [] }))).toBe('is not null');
  });
});

describe('conditionOptions', () => {
  it('offers the family conditions, none for unknown types', () => {
    expect(conditionOptions(number(FilterCondition.Equal, []))[0]).toEqual({ value: 'equal', label: 'equal' });
    expect(conditionOptions(filter({ field: field('bool') }))).toEqual([]);
  });
});

describe('withCondition', () => {
  it('keeps values that fit and drops the others', () => {
    expect(withCondition(filter(), FilterCondition.NotIn).values).toEqual(['Asia', 'Europe']);
    expect(withCondition(filter(), FilterCondition.Like)).toMatchObject({ condition: FilterCondition.Like, values: [] });
  });
});

describe('appliedFilter', () => {
  it.each([
    ['trims list values and drops blanks', filter({ values: [' Asia ', '', ' '] }), ['Asia']],
    ['keeps both ends of a range', number(FilterCondition.Between, [' 1', '', 'x']), ['1', '']],
    ['keeps the first value', number(FilterCondition.Equal, [' 5 ', '6']), ['5']],
    ['drops a blank value', number(FilterCondition.Equal, ['  ']), []],
    ['drops values a condition does not take', number(FilterCondition.IsNull, ['5']), []]
  ])('%s', (_case, draft, values) => {
    expect(appliedFilter(draft).values).toEqual(values);
  });
});
