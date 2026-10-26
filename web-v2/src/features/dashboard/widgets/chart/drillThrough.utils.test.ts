import { describe, expect, it } from 'vitest';
import { parseFiltersParam } from '@/core/query/filtersParam';
import { FilterCondition, type InternalFilter } from '@/core/query/internalFilter';
import { carriedFilters, drillThroughUrl, filterFields, nextDrillThroughFrom } from './drillThrough.utils';

const field = (name: string) => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: name, field_type: 'string' });
const filter = (id: number, name: string, value: string): InternalFilter => ({
  id,
  name,
  field: field(name),
  condition: FilterCondition.In,
  values: [value],
  enabled: true,
  nested: false
});

describe('carriedFilters', () => {
  it('puts the header filters first', () => {
    const header = [filter(-1, 'region', 'Asia')];
    const clicked = [filter(0, 'country', 'Japan')];
    expect(carriedFilters(header, clicked)).toEqual([...header, ...clicked]);
    expect(carriedFilters([], [])).toEqual([]);
  });
});

describe('filterFields', () => {
  it('lists each field once', () => {
    expect(filterFields([filter(-1, 'region', 'Asia'), filter(0, 'region', 'Europe'), filter(0, 'country', 'Japan')])).toEqual([
      field('region'),
      field('country')
    ]);
  });
});

describe('drillThroughUrl', () => {
  it('opens the dashboard with the filters, keeping the token', () => {
    const filters = [filter(0, 'region', 'Asia')];
    const url = new URL(drillThroughUrl({ id: 2, name: 'v2 Filters' }, filters, '?token=abc&filters=old'), 'http://app.test');
    expect(url.pathname).toBe('/dashboard/v2-filters-2');
    expect(url.searchParams.get('token')).toBe('abc');
    expect(parseFiltersParam(url.searchParams.get('filters'))).toEqual([{ ...filters[0], id: -1 }]);
  });

  it('works without a query string', () => {
    expect(drillThroughUrl({ id: 2, name: 'B' }, [], '')).toBe('/dashboard/b-2?filters=%5B%5D');
  });
});

describe('nextDrillThroughFrom', () => {
  it('continues after the loaded dashboards', () => {
    expect(nextDrillThroughFrom([{ total: 50, dashboards: new Array(40) }])).toBe(40);
  });

  it('stops once all are loaded, or a page comes back empty', () => {
    expect(nextDrillThroughFrom([{ total: 2, dashboards: [1, 2] }])).toBeUndefined();
    expect(nextDrillThroughFrom([{ total: 50, dashboards: [] }])).toBeUndefined();
    expect(nextDrillThroughFrom([])).toBeUndefined();
  });
});
