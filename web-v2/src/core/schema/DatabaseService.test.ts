import { describe, expect, it } from 'vitest';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import { databaseEntryFromJson, HttpDatabaseService } from './DatabaseService';
import fixture from './warehouse.fixture.json';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpDatabaseService(http), requests };
}

describe('databaseEntryFromJson', () => {
  it('reads a database without an owner', () => {
    expect(databaseEntryFromJson(fixture.myData.response.data[0])).toEqual({
      name: 'bi_service_schema',
      displayName: 'bi_service_schema',
      creatorId: '',
      createdTime: 1793295348830,
      updatedTime: 1793295348830,
      owner: undefined
    });
  });

  it('reads the owner when there is one', () => {
    const entry = databaseEntryFromJson(fixture.multiGets.response[0]);
    expect(entry).toMatchObject({ name: 'dw0_probe', creatorId: 'root' });
    expect(entry.owner?.email).toBe('hello@gmail.com');
  });
});

describe('HttpDatabaseService', () => {
  it('lists every database in one request', async () => {
    const { service, requests } = setup({ body: fixture.myData.response });

    const databases = await service.listMyData();

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/databases/my_data' });
    expect(databases).toHaveLength(fixture.myData.response.total);
    expect(databases.map(item => item.name)).toContain('sample_v2');
  });

  it('creates a database', async () => {
    const { service, requests } = setup({ body: fixture.databaseCreate.response });

    await expect(service.create('dw0_probe', 'DW0 Probe')).resolves.toEqual({ name: 'dw0_probe', displayName: 'dw0_probe' });
    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/databases', body: fixture.databaseCreate.request });
  });

  it('deletes a database, encoding its name', async () => {
    const { service, requests } = setup({ body: true });

    await service.delete('a b');

    expect(requests[0]).toMatchObject({ method: 'DELETE', url: 'http://api.test/databases/a%20b' });
  });
});
