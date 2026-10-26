import { describe, expect, it } from 'vitest';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type JsonTableResponse, type TableHeader } from '@/core/query/VisualizationResponse';
import { toColumns, toRows, toTableSort } from './table.utils';

const response = visualizationResponseFromJson(responses.table_chart_setting) as JsonTableResponse;

describe('toColumns', () => {
  it('reads cells by header key and aligns numbers right', () => {
    expect(toColumns(response.headers).map(column => ({ ...column, render: undefined }))).toEqual([
      { key: '0', title: 'region', dataIndex: ['record', '0'], align: 'left', ellipsis: true, sorter: true, sortOrder: null, render: undefined },
      { key: '1', title: 'country', dataIndex: ['record', '1'], align: 'left', ellipsis: true, sorter: true, sortOrder: null, render: undefined },
      { key: '2', title: 'item_type', dataIndex: ['record', '2'], align: 'left', ellipsis: true, sorter: true, sortOrder: null, render: undefined },
      { key: '3', title: 'total_revenue', dataIndex: ['record', '3'], align: 'right', ellipsis: true, sorter: true, sortOrder: null, render: undefined }
    ]);
  });

  it('nests grouped headers', () => {
    const leaf: TableHeader = { key: '1', label: 'Online', isGroupBy: false, isTextLeft: false, formatterKey: '', children: [] };
    const [column] = toColumns([{ ...leaf, key: 'g', label: 'Channel', children: [leaf] }]);
    expect(column).toMatchObject({ key: 'g', title: 'Channel', children: [{ dataIndex: ['record', '1'], title: 'Online' }] });
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

  it('reads antd sorter as a sort', () => {
    expect(toTableSort({ column: { title: 'region' }, order: 'ascend' })).toEqual({ column: 'region', direction: 'ASC' });
    expect(toTableSort([{ column: { title: 'region' }, order: 'descend' }])).toEqual({ column: 'region', direction: 'DESC' });
    expect(toTableSort({ column: { title: 'region' }, order: undefined })).toBeUndefined();
    expect(toTableSort({ order: 'ascend' })).toBeUndefined();
  });
});
