import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { RelationshipInfo } from './RelationshipInfo';
import { HttpRelationshipService } from './RelationshipService';

const INFO_JSON = {
  views: [{ class_name: 'table_view', db_name: 'sample_v2', tbl_name: 'sales', alias_name: 'tbl_4d03e2' }],
  relationships: [],
  extra_data: { table_positions: { sampleV2Sales: { left: 10, top: 20 } } }
};

function setup(body: unknown) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return Response.json(body);
  });
  const service = new HttpRelationshipService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
  return { service, requests, sent: () => JSON.parse(requests[0]?.body || 'null') as unknown };
}

describe('HttpRelationshipService', () => {
  it("reads a dashboard's relationships", async () => {
    const { service, requests } = setup(INFO_JSON);

    const info = await service.getDashboardRelationship(1);

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/relationships/1' });
    expect(info.views[0]).toMatchObject({ dbName: 'sample_v2', tblName: 'sales' });
    expect(info.tablePositions).toEqual({ sampleV2Sales: { left: 10, top: 20 } });
  });

  it("saves a dashboard's relationships", async () => {
    const { service, requests, sent } = setup({ success: true });

    await service.saveDashboardRelationship(1, new RelationshipInfo(INFO_JSON));

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/relationships/1' });
    expect(sent()).toEqual(INFO_JSON);
  });

  it('reads and saves the global relationships', async () => {
    const read = setup(INFO_JSON);
    await read.service.getGlobalRelationship();
    expect(read.requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/relationships/global' });

    const save = setup({ success: true });
    await save.service.saveGlobalRelationship(new RelationshipInfo(INFO_JSON));
    expect(save.requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/relationships/global' });
  });

  it('fails when the server does not report success', async () => {
    const { service } = setup({ success: false });

    await expect(service.saveDashboardRelationship(1, new RelationshipInfo())).rejects.toThrow(
      'Cannot save the relationships'
    );
  });
});
