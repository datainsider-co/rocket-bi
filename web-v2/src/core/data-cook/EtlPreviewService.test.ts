import { describe, expect, it } from 'vitest';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import fixture from './etl.fixture.json';
import { etlOperatorFromJson } from './EtlOperator';
import { HttpEtlPreviewService } from './EtlPreviewService';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpEtlPreviewService(http), requests };
}

describe('HttpEtlPreviewService', () => {
  it('reads the preview database name', async () => {
    const { service, requests } = setup({ body: fixture.databaseName.response });

    await expect(service.databaseName(1)).resolves.toBe('preview_etl_1');
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/data_cook/1/preview/database_name' });
  });

  it('previews operators and reads the tables built', async () => {
    const { service, requests } = setup({ body: fixture.previewDone.response });
    const operator = etlOperatorFromJson(fixture.previewDone.request.operators[0]);

    const preview = await service.preview(1, [operator], true);

    expect(requests[0]).toEqual({
      method: 'POST',
      url: 'http://api.test/data_cook/1/preview_sync',
      body: fixture.previewDone.request
    });
    expect(preview.status).toBe('Done');
    expect(preview.tables.map(table => `${table.dbName}.${table.name}`)).toEqual(['preview_etl_1.sales', 'preview_etl_1.sales_transform']);
    expect(preview.errors).toEqual([]);
  });

  it('reads the table that failed and why', async () => {
    const { service } = setup({ body: fixture.previewError.response });
    const operator = etlOperatorFromJson(fixture.previewError.request.operators[0]);

    const preview = await service.preview(1, [operator], true);

    expect(preview.status).toBe('Error');
    expect(preview.tables.map(table => table.name)).toEqual(['sales']);
    expect(preview.errors).toEqual([{ tblName: 'sales_sql', message: 'No database selected' }]);
  });

  it('reads the SQL of Manage Fields', async () => {
    const { service, requests } = setup({ body: fixture.viewQuery.response });
    const manage = etlOperatorFromJson(fixture.etlUpdate.response.operators[2]);
    if (manage.kind !== 'manageFields') throw new Error('expected Manage Fields');

    const query = await service.viewQuery(1, manage.fields, manage.extraFields);

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/data_cook/1/view_query', body: fixture.viewQuery.request });
    expect(query).toContain('as `Double Units`');
  });
});
