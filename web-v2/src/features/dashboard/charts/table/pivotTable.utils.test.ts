import { describe, expect, it } from 'vitest';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type JsonTableResponse, type TableHeader } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { isPivotPaged, leafHeaders, pivotHeaderColumnOf, pivotSortable, pivotSortColumns, pivotTotals, toLazyPivotRows } from './pivotTable.utils';

/** A real response: region down, sales channel across, total_revenue and units_sold in each cell (3 regions kept). */
const response = visualizationResponseFromJson(responses.pivot_table_chart_setting) as JsonTableResponse;

const column = (name: string, className = 'group') => ({ name, function: { class_name: className } });
const region = column('region');
const country = column('country');
const channel = column('sales_channel');
const revenue = column('total_revenue', 'sum');
const units = column('units_sold', 'sum');
const across = { class_name: 'pivot_table_chart_setting', rows: [region, country], columns: [channel], values: [revenue, units] };
const down = { ...across, columns: [] };

const header = (label: string, extra: Partial<TableHeader> = {}): TableHeader => ({ key: label, label, isGroupBy: false, isTextLeft: false, formatterKey: '', children: [], ...extra });

describe('pivotHeaderColumnOf', () => {
  it('reads the row group header as the first row group', () => {
    expect(pivotHeaderColumnOf(across)(header('region', { isGroupBy: true }))).toEqual({ name: 'region', column: region });
  });

  it('reads a value header under the columns across by its name', () => {
    const [, offline] = response.headers;
    const [offlineRevenue, offlineUnits] = offline?.children ?? [];
    const columnOf = pivotHeaderColumnOf(across);
    expect(offlineRevenue && columnOf(offlineRevenue)).toEqual({ name: 'total_revenue', column: revenue });
    expect(offlineUnits && columnOf(offlineUnits)).toEqual({ name: 'units_sold', column: units });
  });

  it('reads every header under the columns across as the only value', () => {
    expect(pivotHeaderColumnOf({ ...across, values: [revenue] })(header('Offline'))).toEqual({ name: 'total_revenue', column: revenue });
  });

  it('reads a value header without columns across by the name before " by "', () => {
    expect(pivotHeaderColumnOf(down)(header('units_sold by region'))).toEqual({ name: 'units_sold', column: units });
  });

  it('names an unknown header by its label', () => {
    expect(pivotHeaderColumnOf(across)(header('profit'))).toEqual({ name: 'profit', column: {} });
    expect(pivotHeaderColumnOf({})(header('region', { isGroupBy: true }))).toEqual({ name: 'region', column: {} });
  });
});

describe('pivotSortColumns / pivotSortable', () => {
  it('sorts by the first row group, and by the values without columns across', () => {
    expect(pivotSortColumns(across)).toEqual([region]);
    expect(pivotSortColumns(down)).toEqual([region, revenue, units]);
    expect(pivotSortColumns({ values: [revenue] })).toEqual([revenue]);
  });

  it('lets only the row group header sort under columns across', () => {
    expect(pivotSortable(across)(header('region', { isGroupBy: true }))).toBe(true);
    expect(pivotSortable(across)(header('total_revenue'))).toBe(false);
    expect(pivotSortable(down)(header('total_revenue by region'))).toBe(true);
  });
});

describe('isPivotPaged', () => {
  it('pages the rows only when there are row groups', () => {
    expect(isPivotPaged(across)).toBe(true);
    expect(isPivotPaged({ ...across, rows: [] })).toBe(false);
  });
});

describe('toLazyPivotRows', () => {
  const groupKey = '960db2';
  const records = response.records.slice(0, 2);

  it('gives the rows their path, and a toggle while a row group follows', () => {
    const rows = toLazyPivotRows({ records, from: 20, groupKey, levels: 2, childrenOf: () => undefined });
    expect(rows.map(row => [row.key, row.path, row.children])).toEqual([
      ['20', ['Asia'], []],
      ['21', ['Australia and Oceania'], []]
    ]);
  });

  it('puts the loaded rows under theirs, the last row group without a toggle', () => {
    const japan = { [groupKey]: 'Japan' };
    const rows = toLazyPivotRows({ records, from: 0, groupKey, levels: 2, childrenOf: key => (key === '0' ? [japan] : undefined) });
    expect(rows[0]?.children).toEqual([{ key: '0-0', record: japan, path: ['Asia', 'Japan'] }]);
  });

  it('reads a missing value as empty, like v1', () => {
    expect(toLazyPivotRows({ records: [{}], from: 0, groupKey, levels: 1, childrenOf: () => undefined })).toEqual([{ key: '0', record: {}, path: [''] }]);
  });
});

describe('leafHeaders', () => {
  it('lists the headers with cells, in order', () => {
    expect(leafHeaders(response.headers).map(item => item.label)).toEqual(['region', 'total_revenue', 'units_sold', 'total_revenue', 'units_sold']);
    expect(leafHeaders([])).toEqual([]);
  });
});

describe('pivotTotals', () => {
  const text = (_header: TableHeader, value: string) => `#${value}`;
  const options = {} as VizOptions;

  it('puts the label under the row group and each total under its column', () => {
    expect(pivotTotals(across, options, response.headers, text)?.cells).toEqual([
      { key: '960db2', text: 'Total', isLabel: true },
      { key: 'e1015b', text: '#1.2792258188999999E8', isLabel: false },
      { key: 'd28fcf', text: '#587060', isLabel: false },
      { key: 'd3cac9', text: '#1.2284877647999996E8', isLabel: false },
      { key: '663c43', text: '#441986', isLabel: false }
    ]);
  });

  it('uses the label text, or none when the label is off', () => {
    const custom = pivotTotals(across, { total: { label: { text: 'Sum' } } } as VizOptions, response.headers, text);
    expect(custom?.cells[0]?.text).toBe('Sum');
    const off = pivotTotals(across, { total: { label: { enabled: false, text: 'Sum' } } } as VizOptions, response.headers, text);
    expect(off?.cells[0]?.text).toBe('');
  });

  it('leaves a column without a total empty', () => {
    const cells = pivotTotals(across, options, [header('region', { isGroupBy: true }), header('a', { total: '1' }), header('b')], text)?.cells;
    expect(cells?.map(cell => cell.text)).toEqual(['Total', '#1', '']);
  });

  it('has none when turned off, without row groups or without any total', () => {
    expect(pivotTotals(across, { total: { enabled: false } } as VizOptions, response.headers, text)).toBeUndefined();
    expect(pivotTotals({ ...across, rows: [] }, options, response.headers, text)).toBeUndefined();
    expect(pivotTotals(across, options, [header('region', { isGroupBy: true })], text)).toBeUndefined();
  });
});
