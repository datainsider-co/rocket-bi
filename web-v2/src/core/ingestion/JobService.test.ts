import { describe, expect, it } from 'vitest';
import fixture from './ingestion.fixture.json';
import { jobFromJson, type JdbcJob } from './Job';
import { HttpJobService } from './JobService';
import { fakeHttp, type Reply } from './testing';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpJobService(http), requests };
}

const job = jobFromJson(fixture.jobCreate.response.job) as JdbcJob;

describe('HttpJobService', () => {
  it('lists jobs with their source', async () => {
    const { service, requests } = setup({ body: fixture.jobList.response });

    const page = await service.list({ from: 0, size: 10 });

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/job/list', body: { from: 0, size: 10 } });
    expect(page.total).toBe(3);
    expect(page.data.map(info => info.job.id)).toEqual([1, 2, 3]);
    expect(page.data[0]?.source).toMatchObject({ kind: 'jdbc', id: 1 });
  });

  it('filters on the current status', async () => {
    const { service, requests } = setup({ body: fixture.jobListQueued.response });

    await service.list({ from: 0, size: 10, keyword: 'sales' }, ['Queued', 'Syncing']);

    expect(requests[0]?.body).toEqual({ from: 0, size: 10, keyword: 'sales', current_statuses: ['Queued', 'Syncing'] });
  });

  it('creates a job wrapped in job', async () => {
    const { service, requests } = setup({ body: fixture.jobCreate.response });

    await expect(service.create(job)).resolves.toMatchObject({ job: { id: 1 }, source: { id: 1 } });
    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/job/create' });
    expect(requests[0]?.body).toEqual({ job: expect.objectContaining({ class_name: 'jdbc_job', table_name: 'sales' }) });
  });

  it('creates one job per table from a base job', async () => {
    const { service, requests } = setup({ body: fixture.jobMultiCreate.response });

    await service.createForTables({ ...job, tableName: '' }, ['organization', 'role']);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/job/multi_create' });
    expect(requests[0]?.body).toEqual({
      base_job: expect.objectContaining({ class_name: 'jdbc_job', table_name: '' }),
      table_names: ['organization', 'role']
    });
  });

  it('updates a job by id', async () => {
    const { service, requests } = setup({ body: { success: true } });

    await service.update({ ...job, displayName: 'Renamed' });

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/job/1' });
    expect(requests[0]?.body).toEqual({ job: expect.objectContaining({ display_name: 'Renamed' }) });
  });

  it('deletes one job, and several with their ids in the body', async () => {
    const { service, requests } = setup({ body: { success: true } });

    await service.delete(3);
    await service.deleteMany([4, 5]);

    expect(requests).toEqual([
      { method: 'DELETE', url: 'http://api.test/job/3', body: undefined },
      { method: 'DELETE', url: 'http://api.test/job/multi_delete', body: { ids: [4, 5] } }
    ]);
  });

  it('syncs a job now in Continuous mode', async () => {
    const { service, requests } = setup({ body: fixture.jobSyncNow.response });

    await service.syncNow(1, 1793208065000);

    expect(requests[0]).toEqual({
      method: 'PUT',
      url: 'http://api.test/schedule/job/1/now',
      body: { at_time: 1793208065000, mode: 'Continuous' }
    });
  });

  it('syncs several jobs now and reports each one', async () => {
    const { service, requests } = setup({ body: fixture.jobMultiSyncNow.response });

    await expect(service.syncManyNow([2, 3, 9], 1793208065000)).resolves.toEqual({ 2: true, 3: true, 9: false });
    expect(requests[0]).toEqual({
      method: 'PUT',
      url: 'http://api.test/schedule/job/multi_sync/now',
      body: { at_time: 1793208065000, mode: 'Continuous', ids: [2, 3, 9] }
    });
  });

  it.each([
    [{ success: true }, true],
    [fixture.jobKill.response, false]
  ])('cancels a job (%j)', async (reply, expected) => {
    const { service, requests } = setup({ body: reply });

    await expect(service.cancel(3)).resolves.toBe(expected);
    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/schedule/job/3/kill' });
  });
});
