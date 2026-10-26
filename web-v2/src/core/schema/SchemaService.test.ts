import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import fixture from './database.fixture.json';
import { HttpSchemaService, databaseSchemaFromJson, tableField } from './SchemaService';

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

describe('HttpSchemaService', () => {
  it('gets one database', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify(fixture)));
    const http = new HttpClientBuilder('http://api').withFetch(fetch).build();
    const schema = await new HttpSchemaService(http).getDatabase('sample v2');
    expect(schema.tables).toHaveLength(1);
    expect((fetch.mock.calls[0]![0] as Request).url).toBe('http://api/databases/sample%20v2');
  });
});
