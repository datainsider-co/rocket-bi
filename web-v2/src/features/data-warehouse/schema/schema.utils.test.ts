import { describe, expect, it } from 'vitest';
import { visualizationResponseFromJson, type JsonTableResponse } from '@/core/query/VisualizationResponse';
import { tableDefinitionFromJson } from '@/core/schema/TableDefinition';
import fixture from '@/core/schema/warehouse.fixture.json';
import {
  canUpdateByQuery,
  columnTypeLabel,
  filterColumns,
  filterTables,
  isProcessing,
  previewColumns,
  previewRows,
  queryTablePath,
  selectionFromParams,
  selectionToParams,
  tablePreviewRequest,
  updateByQueryPath
} from './schema.utils';

const products = tableDefinitionFromJson(fixture.tableUpdate.response);
const view = tableDefinitionFromJson(fixture.fromQueryView.response);
const databases = [
  { name: 'dw0_probe', displayName: 'dw0_probe' },
  { name: 'sample_v2', displayName: 'sample_v2' }
];

describe('selectionFromParams', () => {
  it('reads the database and table', () => {
    expect(selectionFromParams(new URLSearchParams('database=sample_v2&table=sales'), databases)).toEqual({ dbName: 'sample_v2', tableName: 'sales' });
  });

  it('opens the first database without one, ignoring a table alone', () => {
    expect(selectionFromParams(new URLSearchParams('table=sales'), databases)).toEqual({ dbName: 'dw0_probe', tableName: undefined });
  });

  it('selects nothing while there is no database', () => {
    expect(selectionFromParams(new URLSearchParams(''), [])).toEqual({ dbName: undefined, tableName: undefined });
  });
});

describe('selectionToParams', () => {
  it('writes what is selected', () => {
    expect(selectionToParams({ dbName: 'a b', tableName: 't' }).toString()).toBe('database=a+b&table=t');
    expect(selectionToParams({ dbName: 'db', tableName: undefined }).toString()).toBe('database=db');
    expect(selectionToParams({ dbName: undefined, tableName: 't' }).toString()).toBe('');
  });
});

describe('columnTypeLabel', () => {
  it.each([
    ['bool', 'Bool'],
    ['int64', 'Int64'],
    ['datetime', 'Datetime'],
    ['nested', 'nested']
  ])('%s -> %s', (type, label) => {
    expect(columnTypeLabel(type)).toBe(label);
  });
});

describe('filterColumns', () => {
  it('matches the name or the display name', () => {
    expect(filterColumns(products.columns, 'EDITED').map(column => column.name)).toEqual(['name']);
    expect(filterColumns(products.columns, 'created_').map(column => column.name)).toEqual(['created_at']);
  });

  it('keeps every column, in order, for a blank search', () => {
    expect(filterColumns(products.columns, ' ').map(column => column.name)).toEqual(['id', 'name', 'price', 'created_at', 'active', 'qty']);
  });
});

describe('filterTables', () => {
  const tables = [
    { dbName: 'db', name: 'orders', displayName: 'Sales orders', columns: [] },
    { dbName: 'db', name: 'items', columns: [] }
  ];

  it('matches the name or the display name', () => {
    expect(filterTables(tables, 'sales').map(table => table.name)).toEqual(['orders']);
    expect(filterTables(tables, 'ITEM').map(table => table.name)).toEqual(['items']);
    expect(filterTables(tables, '')).toHaveLength(2);
  });
});

describe('table states', () => {
  it('lets views have their query replaced', () => {
    expect(canUpdateByQuery(view)).toBe(true);
    expect(canUpdateByQuery({ tableType: 'materialized' })).toBe(true);
    expect(canUpdateByQuery(products)).toBe(false);
  });

  it('tells a table still being filled', () => {
    expect(isProcessing({ status: 'Processing' })).toBe(true);
    expect(isProcessing(products)).toBe(false);
  });
});

describe('Query Editor links', () => {
  it('queries a table', () => {
    expect(queryTablePath(products)).toBe('/data-warehouse/query-editor?database=dw0_probe&table=products');
  });

  it("updates a view's query", () => {
    expect(updateByQueryPath(view)).toBe(
      '/data-warehouse/query-editor?mode=update&database=dw0_probe&table=big_qty&tableDisplayName=big_qty&tableType=view'
    );
  });
});

describe('tablePreviewRequest', () => {
  it('builds the request DW0 ran, one select per column', () => {
    const { query_setting, from, size } = fixture.tablePreview.request;
    const request = tablePreviewRequest(products, 1, 3, undefined);

    expect(request).toMatchObject({ from, size, filter_requests: [] });
    expect(request['query_setting']).toMatchObject({ class_name: query_setting.class_name, columns: query_setting.columns, sorts: [] });
  });

  it('pages and sorts by a column', () => {
    const request = tablePreviewRequest(products, 3, 20, { column: 'qty', direction: 'DESC' });

    expect(request).toMatchObject({ from: 40, size: 20 });
    expect(request['query_setting']).toMatchObject({ sorts: fixture.tablePreviewSorted.request.query_setting.sorts });
  });

  it('ignores a sort on a column the table no longer has', () => {
    expect(tablePreviewRequest(products, 1, 20, { column: 'gone', direction: 'ASC' })['query_setting']).toMatchObject({ sorts: [] });
  });
});

describe('previewColumns', () => {
  it('titles the response columns with their display names', () => {
    const response = visualizationResponseFromJson(fixture.tablePreview.response) as JsonTableResponse;

    expect(previewColumns(response, products).slice(0, 2)).toEqual([
      { key: 'b80bb7', name: 'id', title: 'Id' },
      { key: 'b06893', name: 'name', title: 'Name edited' }
    ]);
  });
});

describe('previewRows', () => {
  it('keys each row by its place in the whole result, leaving the records alone', () => {
    const records = [{ a: '1' }, { a: '2' }];

    expect(previewRows(records, 40)).toEqual([
      { a: '1', __row: '40' },
      { a: '2', __row: '41' }
    ]);
    expect(records[0]).toEqual({ a: '1' });
  });
});
