import { describe, expect, it } from 'vitest';
import { tableDefinitionFromJson } from '@/core/schema/TableDefinition';
import fixture from '@/core/schema/warehouse.fixture.json';
import {
  canUpdateByQuery,
  columnTypeLabel,
  filterColumns,
  filterTables,
  hasColumnSearch,
  isProcessing,
  queryTablePath,
  schemaTabsOf,
  selectionFromParams,
  selectionToParams,
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

describe('schemaTabsOf', () => {
  it("lists v1's tabs, without the formula ones on a phone", () => {
    expect(schemaTabsOf(false).map(tab => tab.label)).toEqual(['Table Schema', 'Table Data', 'Measure Schema', 'Calculated Field', 'RLS']);
    expect(schemaTabsOf(true).map(tab => tab.value)).toEqual(['schema', 'data', 'rls']);
  });

  it('searches the tabs that list columns', () => {
    expect(hasColumnSearch('schema')).toBe(true);
    expect(hasColumnSearch('measure')).toBe(true);
    expect(hasColumnSearch('data')).toBe(false);
    expect(hasColumnSearch('rls')).toBe(false);
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
