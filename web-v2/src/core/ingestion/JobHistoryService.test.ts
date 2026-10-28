import { describe, expect, it } from 'vitest';
import fixture from './ingestion.fixture.json';
import { HttpJobHistoryService } from './JobHistoryService';
import { fakeHttp } from './testing';

describe('HttpJobHistoryService', () => {
  it('lists the runs', async () => {
    const { http, requests } = fakeHttp({ body: fixture.historyList.response });

    const page = await new HttpJobHistoryService(http).list({
      from: 0,
      size: 10,
      sorts: [{ field: 'id', order: 'DESC' }]
    });

    expect(requests[0]).toEqual({
      method: 'POST',
      url: 'http://api.test/history/list',
      body: { from: 0, size: 10, sorts: [{ field: 'id', order: 'DESC' }] }
    });
    expect(page).toMatchObject({ total: 2, data: [{ syncId: 2 }, { syncId: 1 }] });
  });
});
