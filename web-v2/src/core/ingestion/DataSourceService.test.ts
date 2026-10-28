import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/http/ApiError';
import { dataSourceFromJson, type JdbcSource } from './DataSource';
import { HttpDataSourceService } from './DataSourceService';
import fixture from './ingestion.fixture.json';
import { fakeHttp, type Reply } from './testing';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpDataSourceService(http), requests };
}

const source = dataSourceFromJson(fixture.sourceGet.response) as JdbcSource;

describe('HttpDataSourceService', () => {
  it('lists sources with their creator', async () => {
    const { service, requests } = setup({ body: fixture.sourceList.response });

    const page = await service.list({ from: 0, size: 10, sorts: [{ field: 'last_modified', order: 'DESC' }] });

    expect(requests[0]).toEqual({
      method: 'POST',
      url: 'http://api.test/source/list',
      body: { from: 0, size: 10, sorts: [{ field: 'last_modified', order: 'DESC' }] }
    });
    expect(page.total).toBe(1);
    expect(page.data[0]?.source).toMatchObject({ kind: 'jdbc', id: 1, displayName: 'DI0 MySQL' });
    expect(page.data[0]?.creator?.username).toBe('root');
  });

  it('gets a source', async () => {
    const { service, requests } = setup({ body: fixture.sourceGet.response });

    await expect(service.get(1)).resolves.toMatchObject({ kind: 'jdbc', id: 1 });
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/source/1' });
  });

  it('tests a source with the source itself as the body', async () => {
    const { service, requests } = setup({ body: fixture.sourceTest.response });

    await service.test(source);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/source/test' });
    expect(requests[0]?.body).toMatchObject({ class_name: 'jdbc_source', jdbc_url: source.jdbcUrl });
  });

  it("fails a test with the driver's message", async () => {
    const { service } = setup({ status: 400, body: fixture.sourceTestFailed.response });

    const error = await service.test(source).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toContain('unable to connect to data source');
  });

  it('creates a source wrapped in data_source', async () => {
    const { service, requests } = setup({ body: fixture.sourceCreate.response });

    await expect(service.create(source)).resolves.toMatchObject({ id: 1 });
    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/source/create' });
    expect(requests[0]?.body).toEqual({ data_source: expect.objectContaining({ display_name: 'DI0 MySQL' }) });
  });

  it('updates a source by id', async () => {
    const { service, requests } = setup({ body: fixture.sourceUpdate.response });

    await service.update({ ...source, displayName: 'Renamed' });

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/source/1' });
    expect(requests[0]?.body).toEqual({ data_source: expect.objectContaining({ display_name: 'Renamed' }) });
  });

  it('deletes one source, and several with their ids in the body', async () => {
    const { service, requests } = setup({ body: { success: true } });

    await service.delete(4);
    await service.deleteMany([2, 3]);

    expect(requests).toEqual([
      { method: 'DELETE', url: 'http://api.test/source/4', body: undefined },
      { method: 'DELETE', url: 'http://api.test/source/multi_delete', body: { ids: [2, 3] } }
    ]);
  });

  it('lists databases, tables and columns of a source', async () => {
    const { service, requests } = setup(
      { body: fixture.sourceDatabases.response },
      { body: fixture.sourceTables.response },
      { body: [...fixture.sourceColumns.response, 7] }
    );

    await expect(service.listDatabases(1)).resolves.toContain('caas');
    await expect(service.listTables(1, 'caas')).resolves.toContain('user');
    await expect(service.listColumns(1, 'caas', 'user')).resolves.toEqual(fixture.sourceColumns.response);

    expect(requests.map(({ url, body }) => [url, body])).toEqual([
      ['http://api.test/source/1/database', { extra_data: '{}' }],
      ['http://api.test/source/table', { source_id: 1, database_name: 'caas', extra_data: '{}' }],
      ['http://api.test/source/column', { source_id: 1, database_name: 'caas', table_name: 'user', extra_data: '{}' }]
    ]);
  });
});
