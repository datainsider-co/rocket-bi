import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import fixture from './database.fixture.json';
import { HttpSchemaService, databaseInfosFromJson, databaseSchemaFromJson, tableField, tableSchemaFromJson } from './SchemaService';

describe('databaseSchemaFromJson', () => {
  it('reads tables and their column types', () => {
    const schema = databaseSchemaFromJson(fixture);
    const sales = schema.tables[0]!;
    expect(schema.name).toBe('sample_v2');
    expect(sales.name).toBe('sales');
    expect(sales.columns.find(column => column.name === 'order_date')).toEqual({ name: 'order_date', displayName: 'order_date', type: 'datetime' });
    expect(tableField(sales, sales.columns[0]!)).toEqual({
      class_name: 'table_field',
      db_name: 'sample_v2',
      tbl_name: 'sales',
      field_name: 'region',
      field_type: 'string'
    });
  });

  it('falls back on missing names', () => {
    expect(databaseSchemaFromJson({ name: 'db', tables: [{ name: 't', columns: [{ name: 'c' }] }] })).toEqual({
      name: 'db',
      tables: [{ dbName: 'db', name: 't', columns: [{ name: 'c', displayName: 'c', type: '' }] }]
    });
  });
});

describe('databaseInfosFromJson', () => {
  it('sorts by display name, falling back on the name', () => {
    expect(databaseInfosFromJson([{ name: 'b_db', display_name: 'Zeta' }, { name: 'alpha' }, { name: 'c', display_name: 'Beta', tables: [] }])).toEqual([
      { name: 'alpha', displayName: 'alpha' },
      { name: 'c', displayName: 'Beta' },
      { name: 'b_db', displayName: 'Zeta' }
    ]);
    expect(databaseInfosFromJson(undefined)).toEqual([]);
  });
});

describe('HttpSchemaService', () => {
  it('lists the databases', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify([{ name: 'sample_v2', display_name: 'sample_v2' }])));
    const http = new HttpClientBuilder('http://api').withFetch(fetch).build();
    expect(await new HttpSchemaService(http).listDatabases()).toEqual([{ name: 'sample_v2', displayName: 'sample_v2' }]);
    expect((fetch.mock.calls[0]![0] as Request).url).toBe('http://api/databases');
  });

  it('gets one database', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify(fixture)));
    const http = new HttpClientBuilder('http://api').withFetch(fetch).build();
    const schema = await new HttpSchemaService(http).getDatabase('sample v2');
    expect(schema.tables).toHaveLength(1);
    expect((fetch.mock.calls[0]![0] as Request).url).toBe('http://api/databases/sample%20v2');
  });
});

describe('tableSchemaFromJson', () => {
  it("reads a view's SQL, measures, calculated and nested columns, leaving empty keys out", () => {
    const table = tableSchemaFromJson({
      name: 'orders',
      db_name: 'shop',
      display_name: 'Orders',
      table_type: 'view',
      query: 'select 1',
      columns: [{ class_name: 'nested', name: 'items', display_name: 'Items', nested_columns: [{ class_name: 'int32', name: 'qty' }] }],
      expression_columns: [{ class_name: 'double', name: 'revenue', default_expression: { default_type: 'default', expr: 'sum(price)' } }],
      calculated_columns: []
    });
    expect(table).toEqual({
      dbName: 'shop',
      name: 'orders',
      displayName: 'Orders',
      tableType: 'view',
      query: 'select 1',
      columns: [{ name: 'items', displayName: 'Items', type: 'nested', nestedColumns: [{ name: 'qty', displayName: 'qty', type: 'int32' }] }],
      expressionColumns: [{ name: 'revenue', displayName: 'revenue', type: 'double', expression: 'sum(price)' }]
    });
  });

  it('leaves out a null query and the empty lists the real backend sends', () => {
    // Trimmed table of the local backend's `GET databases/sample_v2`.
    const sales = tableSchemaFromJson({
      name: 'sales',
      db_name: 'sample_v2',
      display_name: 'sales',
      columns: [],
      query: null,
      table_type: 'default',
      expression_columns: [],
      calculated_columns: []
    });
    expect(sales).toEqual({ dbName: 'sample_v2', name: 'sales', displayName: 'sales', tableType: 'default', columns: [] });
  });

  it('keeps an empty db_name of an ad-hoc table', () => {
    expect(tableSchemaFromJson({ name: 'adhoc_view', db_name: '', columns: [] }, 'db')).toEqual({ dbName: '', name: 'adhoc_view', columns: [] });
  });

  it('falls back to the given database name', () => {
    expect(tableSchemaFromJson({ name: 't' }, 'db').dbName).toBe('db');
  });
});

describe('HttpSchemaService.detectTableSchema', () => {
  it('posts the query to databases/adhoc/tables', async () => {
    // Trimmed reply of the local backend.
    const reply = { name: 'adhoc_view', db_name: '', columns: [{ class_name: 'int64', name: 'order_id', display_name: 'order_id' }] };
    const requests: { method: string; url: string; body: string }[] = [];
    const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
      requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
      return new Response(JSON.stringify(reply));
    });
    const http = new HttpClientBuilder('http://api').withFetch(fetch).build();

    const table = await new HttpSchemaService(http).detectTableSchema('select order_id from sample_v2.sales');

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api/databases/adhoc/tables' });
    expect(JSON.parse(requests[0]?.body ?? '')).toEqual({ query: 'select order_id from sample_v2.sales' });
    expect(table).toEqual({ dbName: '', name: 'adhoc_view', columns: [{ name: 'order_id', displayName: 'order_id', type: 'int64' }] });
  });
});
