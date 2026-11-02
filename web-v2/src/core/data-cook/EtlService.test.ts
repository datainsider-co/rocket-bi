import { describe, expect, it } from 'vitest';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import fixture from './etl.fixture.json';
import { etlJobFromJson } from './EtlJob';
import { HttpEtlService } from './EtlService';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpEtlService(http), requests };
}

describe('HttpEtlService', () => {
  it.each([
    ['mine', 'my_etl'],
    ['shared', 'shared'],
    ['trash', 'trash']
  ] as const)('lists %s ETLs from data_cook/%s', async (listing, path) => {
    const { service, requests } = setup({ body: fixture.myEtl.response });

    const page = await service.list(listing, { from: 0, size: 10, sorts: [{ field: 'created_time', order: 'DESC' }] });

    expect(requests[0]).toEqual({
      method: 'POST',
      url: `http://api.test/data_cook/${path}`,
      body: { from: 0, size: 10, sorts: [{ field: 'created_time', order: 'DESC' }] }
    });
    expect(page.total).toBe(3);
    expect(page.data.map(etl => etl.id)).toEqual([4, 2, 1]);
  });

  it('gets an ETL with its operators', async () => {
    const { service, requests } = setup({ body: fixture.etlGetV1.response });

    const etl = await service.get(2);

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/data_cook/2' });
    expect(etl.operators).toHaveLength(2);
  });

  it('rejects an ETL that is gone', async () => {
    const { service } = setup({ status: 404, body: fixture.etlGetMissing.response });

    await expect(service.get(9999)).rejects.toMatchObject({ status: 404 });
  });

  it('creates an empty ETL', async () => {
    const { service, requests } = setup({ body: fixture.etlCreate.response });

    const etl = await service.create('DC0 fixture');

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/data_cook/create' });
    expect(requests[0]?.body).toMatchObject(fixture.etlCreate.request);
    expect(etl).toMatchObject({ id: 4, displayName: 'DC0 fixture' });
  });

  it('updates an ETL and reads back what the server stored', async () => {
    const { service, requests } = setup({ body: fixture.etlUpdate.response });
    const etl = etlJobFromJson(fixture.etlUpdate.response);

    const saved = await service.update(etl);

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/data_cook/1' });
    expect(requests[0]?.body).toMatchObject({
      display_name: 'DC0 probe',
      schedule_time: fixture.etlUpdate.request.schedule_time,
      extra_data: fixture.etlUpdate.request.extra_data
    });
    expect(saved.operators).toHaveLength(5);
  });

  it('moves to the trash, restores and deletes forever', async () => {
    const { service, requests } = setup({ body: fixture.archive.response });

    await service.moveToTrash(4);
    await service.restore(4);
    await service.deleteForever(4);

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['DELETE', 'http://api.test/data_cook/4'],
      ['POST', 'http://api.test/data_cook/trash/4/restore'],
      ['DELETE', 'http://api.test/data_cook/trash/4']
    ]);
  });

  it('forces a run and cancels it', async () => {
    const { service, requests } = setup({ body: fixture.forceRun.response });

    await service.forceRun(2, 1793634000000);
    await service.cancel(2);

    expect(requests[0]).toEqual({
      method: 'PUT',
      url: 'http://api.test/data_cook/2/force_run',
      body: fixture.forceRun.request
    });
    expect(requests[1]).toEqual({ method: 'PUT', url: 'http://api.test/data_cook/2/kill', body: {} });
  });
});
