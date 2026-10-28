import { describe, expect, it } from 'vitest';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type JsonTableResponse, type TableHeader } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { headerColumnOf, tableCellText, tableNumberFormat, toColumns, toRows, toTableSort } from './table.utils';

const response = visualizationResponseFromJson(responses.table_chart_setting) as JsonTableResponse;

describe('toColumns', () => {
  it('reads cells by header key and aligns numbers right', () => {
    expect(toColumns(response.headers)).toMatchObject([
      { key: '0', title: 'region', dataIndex: ['record', '0'], align: 'left', ellipsis: { showTitle: false }, sorter: true, sortOrder: null },
      { key: '1', title: 'country', dataIndex: ['record', '1'], align: 'left', ellipsis: { showTitle: false }, sorter: true, sortOrder: null },
      { key: '2', title: 'item_type', dataIndex: ['record', '2'], align: 'left', ellipsis: { showTitle: false }, sorter: true, sortOrder: null },
      { key: '3', title: 'total_revenue', dataIndex: ['record', '3'], align: 'right', ellipsis: { showTitle: false }, sorter: true, sortOrder: null }
    ]);
  });

  it('gives each cell its full text for its tooltip', () => {
    const [, , , revenue] = toColumns(response.headers, undefined, value => `$${value}`);
    const row = toRows(response.records, 0)[0];
    expect(revenue?.onHeaderCell?.({})).toEqual({ 'data-title': 'total_revenue' });
    const onCell = revenue && 'onCell' in revenue ? revenue.onCell : undefined;
    expect(row && onCell?.(row)).toEqual({ 'data-title': `$${String(row?.record['3'])}` });
  });

  it('nests grouped headers', () => {
    const leaf: TableHeader = { key: '1', label: 'Online', isGroupBy: false, isTextLeft: false, formatterKey: '', children: [] };
    const [column] = toColumns([{ ...leaf, key: 'g', label: 'Channel', children: [leaf] }]);
    expect(column).toMatchObject({ key: 'g', title: 'Channel', children: [{ dataIndex: ['record', '1'], title: 'Online' }] });
  });

  it("keys a pivot table's groups, which have no key, by their place", () => {
    const leaf = (key: string): TableHeader => ({ key, label: 'total_revenue', isGroupBy: false, isTextLeft: false, formatterKey: '', children: [] });
    const group = (label: string, children: TableHeader[]): TableHeader => ({ ...leaf(''), label, children });
    const columns = toColumns([group('Offline', [group('C', [leaf('a')])]), group('Online', [leaf('b')])]);
    expect(columns.map(column => column.key)).toEqual(['group-0', 'group-1']);
    expect(columns[0]).toMatchObject({ children: [{ key: 'group-0-0', children: [{ key: 'a' }] }] });
  });
});

describe('toRows', () => {
  it('keys rows by their position in the whole table', () => {
    const rows = toRows(response.records, 40);
    expect(rows.map(row => row.key)).toEqual(['40', '41', '42']);
    expect(rows[0]?.record).toBe(response.records[0]);
  });
});

describe('sorting', () => {
  const header = (label: string): TableHeader => ({ key: label, label, isGroupBy: false, isTextLeft: true, formatterKey: '', children: [] });

  it('marks the sorted column', () => {
    const columns = toColumns([header('region'), header('country')], { column: 'country', direction: 'DESC' });
    expect(columns.map(column => (column as { sortOrder?: unknown }).sortOrder)).toEqual([null, 'descend']);
  });

  it('sorts only by the headers that can', () => {
    const columns = toColumns([header('region'), header('country')], { column: 'country', direction: 'DESC' }, String, undefined, item => item.label === 'region');
    expect(columns.map(column => (column as { sorter?: unknown }).sorter)).toEqual([true, false]);
    expect(columns.map(column => (column as { sortOrder?: unknown }).sortOrder)).toEqual([null, null]);
  });

  it('reads antd sorter as a sort', () => {
    expect(toTableSort({ column: { title: 'region' }, order: 'ascend' })).toEqual({ column: 'region', direction: 'ASC' });
    expect(toTableSort([{ column: { title: 'region' }, order: 'descend' }])).toEqual({ column: 'region', direction: 'DESC' });
    expect(toTableSort({ column: { title: 'region' }, order: undefined })).toBeUndefined();
    expect(toTableSort({ order: 'ascend' })).toBeUndefined();
  });
});

describe('tableNumberFormat', () => {
  it("uses v1's defaults: no display unit, 2 decimals, comma thousands", () => {
    expect(tableNumberFormat({})(6021738.87)).toBe('6,021,738.87');
    expect(tableNumberFormat({})(15)).toBe('15.00');
  });

  it('follows the stored precision, separators and display unit', () => {
    expect(tableNumberFormat({ precision: 0, thousandSep: '.', decimalPoint: ',' })(1234.5)).toBe('1.235');
    const options = { plotOptions: { table: { dataLabels: { displayUnit: 'default' } } } } as VizOptions;
    expect(tableNumberFormat(options)(52150)).toBe('52.15k');
  });
});

describe('tableCellText', () => {
  const number = { isTextLeft: false, isGroupBy: false };
  const format = tableNumberFormat({});

  it('formats numbers and numeric strings in number columns', () => {
    expect(tableCellText(1574222.1, number, format)).toBe('1,574,222.10');
    expect(tableCellText('8', number, format)).toBe('8.00');
  });

  it('keeps text, group by columns and values that are not numbers', () => {
    expect(tableCellText(12, { isTextLeft: true, isGroupBy: false }, format)).toBe('12');
    expect(tableCellText(12, { isTextLeft: false, isGroupBy: true }, format)).toBe('12');
    expect(tableCellText('n/a', number, format)).toBe('n/a');
    expect(tableCellText('', number, format)).toBe('');
    expect(tableCellText(true, number, format)).toBe('true');
  });

  it('shows -- for empty cells', () => {
    expect(tableCellText(null, number, format)).toBe('--');
    expect(tableCellText(undefined, { isTextLeft: true, isGroupBy: false }, format)).toBe('--');
  });
});

describe('headerColumnOf', () => {
  const header = (key: string, label: string): TableHeader => ({ key, label, isGroupBy: false, isTextLeft: false, formatterKey: '', children: [] });
  const region = { name: 'region', function: { class_name: 'group' } };
  const revenue = { name: 'total_revenue', function: { class_name: 'sum' } };

  it("reads a flatten table's column by the header's position, named by its label", () => {
    const columnOf = headerColumnOf({ class_name: 'table_chart_setting', columns: [region, revenue] });
    expect(columnOf(header('1', 'total_revenue'))).toEqual({ name: 'total_revenue', column: revenue });
    expect(columnOf(header('5', 'x'))).toEqual({ name: 'x', column: {} });
  });

  it("reads a collapse table's column by its name in the label", () => {
    const columnOf = headerColumnOf({ class_name: 'group_table_chart_setting', columns: [region, revenue] });
    expect(columnOf(header('4f5daa', 'total_revenue by region'))).toEqual({ name: 'total_revenue', column: revenue });
    expect(columnOf(header('ab12cd', 'profit by region'))).toEqual({ name: 'profit by region', column: {} });
  });

  it('copes with a setting without columns', () => {
    expect(headerColumnOf({})(header('0', 'region'))).toEqual({ name: 'region', column: {} });
  });
});
