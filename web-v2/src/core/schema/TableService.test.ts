import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/http/ApiError';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import { newColumn, newTable, tableDefinitionFromJson } from './TableDefinition';
import { HttpTableService } from './TableService';
import fixture from './warehouse.fixture.json';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpTableService(http), requests };
}

const products = { dbName: 'dw0_probe', name: 'products' };

describe('HttpTableService', () => {
  it('gets a table', async () => {
    const { service, requests } = setup({ body: fixture.tableGet.response });

    await expect(service.getTable(products)).resolves.toMatchObject({ name: 'products', columns: expect.any(Array) });
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/databases/dw0_probe/tables/products' });
  });

  it('creates a table with the body of DW0', async () => {
    const { service, requests } = setup({ body: fixture.tableCreate.response });
    const columns = fixture.tableCreate.request.columns.map(json => ({
      ...newColumn(json.name, json.class_name),
      displayName: json.display_name,
      isNullable: json.is_nullable,
      description: json.description ?? '',
      defaultValue: json.default_value,
      json: json.input_formats ? { input_formats: json.input_formats } : {}
    }));

    await service.createTable(newTable('dw0_probe', 'products', 'Products', columns));

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/databases/dw0_probe/tables' });
    expect(requests[0]?.body).toEqual(fixture.tableCreate.request);
  });

  it('updates a table wrapped in table_schema', async () => {
    const { service, requests } = setup({ body: fixture.tableUpdate.response });
    const table = tableDefinitionFromJson(fixture.tableGet.response);

    const updated = await service.updateTable(table);

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/databases/dw0_probe/tables/products' });
    expect(requests[0]?.body).toEqual({ table_schema: fixture.tableGet.response });
    expect(updated.columns.map(item => item.name)).toContain('qty');
  });

  it('creates a view from a query', async () => {
    const { service, requests } = setup({ body: fixture.fromQueryView.response });
    const { db_name, tbl_name, display_name, query, table_type } = fixture.fromQueryView.request;

    const view = await service.createTableFromQuery({ dbName: db_name, name: tbl_name, displayName: display_name, query, tableType: table_type });

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/databases/dw0_probe/tables/from_query' });
    expect(requests[0]?.body).toEqual(fixture.fromQueryView.request);
    expect(view).toMatchObject({ tableType: 'view', query });
  });

  it('fails with the server message when the table exists', async () => {
    const { service } = setup({ status: 400, body: fixture.fromQueryViewExists.response });
    const { db_name, tbl_name, display_name, query, table_type } = fixture.fromQueryViewExists.request;

    const error = await service
      .createTableFromQuery({ dbName: db_name, name: tbl_name, displayName: display_name, query, tableType: table_type })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('table big_qty already exist in db dw0_probe');
  });
});
