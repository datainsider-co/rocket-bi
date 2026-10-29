import { describe, expect, it } from 'vitest';
import fixture from '@/core/schema/warehouse.fixture.json';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import { rlsPolicyFromJson } from './RlsPolicy';
import { HttpRlsPolicyService } from './RlsPolicyService';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpRlsPolicyService(http), requests };
}

const table = { dbName: 'dw0_probe', name: 'products' };

describe('HttpRlsPolicyService', () => {
  it("lists a table's policies", async () => {
    const { service, requests } = setup({ body: fixture.policiesList.response });

    const policies = await service.list(table);

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/policies/list', body: fixture.policiesList.request });
    expect(policies.map(policy => policy.policyId)).toEqual([1, 2, 3]);
  });

  it('replaces the policies and reads them back', async () => {
    const { service, requests } = setup({ body: fixture.policiesPutReplace.response });
    const kept = rlsPolicyFromJson(fixture.policiesPutReplace.request.policies[0]);

    const saved = await service.put(table, [kept]);

    expect(requests[0]).toEqual({ method: 'PUT', url: 'http://api.test/policies', body: fixture.policiesPutReplace.request });
    expect(saved).toHaveLength(1);
    expect(saved[0]?.userAttribute).toEqual({ key: 'region', values: ['north'], operator: 'Equal' });
  });
});
