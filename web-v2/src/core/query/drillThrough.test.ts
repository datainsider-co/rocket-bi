import { describe, expect, it } from 'vitest';
import { canDrillThrough, drillThroughFilters } from './drillThrough';
import { FilterCondition } from './internalFilter';

const field = (name: string, type: string) => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: name, field_type: type });
const column = (name: string, type: string, extra = {}) => ({ name, function: { class_name: 'group', field: field(name, type), ...extra } });

describe('canDrillThrough', () => {
  it('excludes tab filters only', () => {
    expect(canDrillThrough({ class_name: 'tab_filter_chart_setting' })).toBe(false);
    expect(canDrillThrough({ class_name: 'series_chart_setting' })).toBe(true);
  });
});

describe('drillThroughFilters', () => {
  it('filters text with in', () => {
    expect(drillThroughFilters({ class_name: 'series_chart_setting', x_axis: column('region', 'string') }, 'Asia')).toEqual([
      { id: 0, name: 'region', field: field('region', 'string'), condition: FilterCondition.In, values: ['Asia'], enabled: true, nested: false }
    ]);
  });

  it('filters numbers with equal', () => {
    const [filter] = drillThroughFilters({ class_name: 'pie_chart_setting', legend: column('units', 'int32') }, '5');
    expect(filter).toMatchObject({ condition: FilterCondition.Equal, values: ['5'] });
  });

  it('marks nested columns', () => {
    const [filter] = drillThroughFilters({ class_name: 'pie_chart_setting', legend: column('items.name', 'string') }, 'a');
    expect(filter?.nested).toBe(true);
  });

  it('skips dates, which the filter could not match', () => {
    const x = column('order_date', 'datetime', { scalar_function: { class_name: 'to_year' } });
    expect(drillThroughFilters({ class_name: 'series_chart_setting', x_axis: x }, '2021')).toEqual([]);
  });

  it('uses the x axis of heat maps', () => {
    const setting = { class_name: 'heat_map_chart_setting', x_axis: column('region', 'string') };
    expect(drillThroughFilters(setting, 'Asia')).toHaveLength(1);
  });

  it('turns a histogram bin into two bounds', () => {
    const setting = { class_name: 'histogram_chart_setting', value: column('price', 'double') };
    expect(drillThroughFilters(setting, '[10, 20]').map(({ condition, values }) => [condition, values])).toEqual([
      [FilterCondition.GreaterThanOrEqual, ['10']],
      [FilterCondition.LessThanOrEqual, ['20']]
    ]);
    expect(drillThroughFilters(setting, 'not json')).toEqual([]);
    expect(drillThroughFilters(setting, '[10]')).toEqual([]);
  });

  it('has none for bubbles and charts without a dimension', () => {
    expect(drillThroughFilters({ class_name: 'bubble_chart_setting', x_axis: column('region', 'string') }, 'Asia')).toEqual([]);
    expect(drillThroughFilters({ class_name: 'number_chart_setting' }, '1')).toEqual([]);
  });
});
