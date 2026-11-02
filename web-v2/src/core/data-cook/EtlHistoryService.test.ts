import { describe, expect, it } from 'vitest';
import { fakeHttp } from '@/test/fakeHttp';
import fixture from './etl.fixture.json';
import { etlHistoryFromJson } from './EtlHistory';
import { HttpEtlHistoryService } from './EtlHistoryService';

describe('etlHistoryFromJson', () => {
  it('reads a run with the name of its ETL', () => {
    const [latest] = fixture.history.response.data.map(etlHistoryFromJson);

    expect(latest).toMatchObject({ id: 2, etlId: 1, etlName: 'DC0 probe', status: 'Error', totalExecutionTime: 25 });
    expect(latest?.message).toContain('No database selected');
  });

  it('leaves the name empty without etl_info', () => {
    expect(etlHistoryFromJson({ id: 1, status: 'Done' })).toMatchObject({ id: 1, etlName: '', status: 'Done', message: '' });
  });
});

describe('HttpEtlHistoryService', () => {
  it('lists runs', async () => {
    const { http, requests } = fakeHttp({ body: fixture.history.response });

    const page = await new HttpEtlHistoryService(http).list({ from: 0, size: 10, sorts: [{ field: 'id', order: 'DESC' }] });

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/data_cook/history', body: fixture.history.request });
    expect(page.total).toBe(2);
    expect(page.data.map(run => run.id)).toEqual([2, 1]);
  });
});
