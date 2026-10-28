import { describe, expect, it } from 'vitest';
import { hasLazyPivotRows, isPivotTableSetting, pivotColumnsOf, pivotCurrentSetting, pivotSubRowSetting } from './pivotQuery';

const field = (name: string) => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: name, field_type: 'string' });
const group = (name: string, extra: object = {}) => ({ name, function: { class_name: 'group', field: field(name), ...extra } });
const byYear = { class_name: 'to_year' };

const setting = {
  class_name: 'pivot_table_chart_setting',
  columns: [group('sales_channel')],
  rows: [group('region'), group('country'), group('order_date', { scalar_function: byYear })],
  values: [{ name: 'total_revenue', function: { class_name: 'sum', field: field('total_revenue') } }],
  filters: []
};

const equal = (name: string, value: string, extra: object = {}) => ({ class_name: 'equal', field: field(name), value, ...extra });

describe('isPivotTableSetting / pivotColumnsOf', () => {
  it('tells a pivot setting and reads its zones, skipping what is not a column', () => {
    expect(isPivotTableSetting(setting)).toBe(true);
    expect(isPivotTableSetting({ class_name: 'table_chart_setting' })).toBe(false);
    expect(pivotColumnsOf({ rows: [group('region'), 'x', null] }, 'rows')).toEqual([group('region')]);
    expect(pivotColumnsOf({}, 'values')).toEqual([]);
  });
});

describe('hasLazyPivotRows', () => {
  it('needs columns across and several row groups', () => {
    expect(hasLazyPivotRows(setting)).toBe(true);
    expect(hasLazyPivotRows({ ...setting, columns: [] })).toBe(false);
    expect(hasLazyPivotRows({ ...setting, rows: [group('region')] })).toBe(false);
    expect(hasLazyPivotRows({ ...setting, class_name: 'table_chart_setting' })).toBe(false);
  });
});

describe('pivotCurrentSetting', () => {
  it('keeps the first row group only when rows expand lazily', () => {
    expect(pivotCurrentSetting(setting)['rows']).toEqual([group('region')]);
    expect(setting.rows).toHaveLength(3);
  });

  it('leaves other settings as they are', () => {
    const nested = { ...setting, columns: [] };
    expect(pivotCurrentSetting(nested)).toBe(nested);
    const table = { class_name: 'table_chart_setting', rows: [group('a'), group('b')], columns: [group('c')] };
    expect(pivotCurrentSetting(table)).toBe(table);
  });
});

describe('pivotSubRowSetting', () => {
  it('asks for the next row group under the row, named like the first', () => {
    const sub = pivotSubRowSetting(setting, ['Asia']);
    expect(sub?.['rows']).toEqual([{ ...group('country'), name: 'region' }]);
    expect(sub?.['filters']).toEqual([{ class_name: 'and', conditions: [equal('region', 'Asia')] }]);
  });

  it("filters by every parent's value, with its scalar function", () => {
    const sub = pivotSubRowSetting(setting, ['Asia', 'Japan']);
    expect(sub?.['rows']).toEqual([{ ...group('order_date', { scalar_function: byYear }), name: 'region' }]);
    expect(sub?.['filters']).toEqual([{ class_name: 'and', conditions: [equal('region', 'Asia'), equal('country', 'Japan')] }]);
  });

  it("ands the values with the chart's OR'ed filters instead of adding an OR group", () => {
    const own = [{ class_name: 'and', conditions: [equal('item_type', 'Fruits')] }, { class_name: 'and', conditions: [equal('item_type', 'Meat')] }];
    const sub = pivotSubRowSetting({ ...setting, filters: own }, ['Asia']);
    expect(sub?.['filters']).toEqual([{ class_name: 'and', conditions: [{ class_name: 'or', conditions: own }, equal('region', 'Asia')] }]);
  });

  it('is undefined without a path or past the last row group', () => {
    expect(pivotSubRowSetting(setting, [])).toBeUndefined();
    expect(pivotSubRowSetting(setting, ['Asia', 'Japan', '2012'])).toBeUndefined();
    expect(pivotSubRowSetting({ class_name: 'pivot_table_chart_setting' }, ['Asia'])).toBeUndefined();
  });
});
