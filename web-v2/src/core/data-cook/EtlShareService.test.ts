import { describe, expect, it } from 'vitest';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import { HttpEtlShareService } from './EtlShareService';
import fixture from './etl.fixture.json';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpEtlShareService(http), requests };
}

const viewer = 'up-860803c8-e3be-4afb-b88b-743817456dfc';

describe('HttpEtlShareService', () => {
  it('reads who the ETL is shared with', async () => {
    const { service, requests } = setup({ body: fixture.shareListShared.response });

    const sharing = await service.getSharing(1);

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/data_cook/1/share/list' });
    expect(sharing.owner.username).toBe('root');
    expect(sharing.usersSharing[0]).toMatchObject({ id: 's_2', permissions: ['0:etl:view:1'] });
    expect(sharing.usersSharing[0]?.user.username).toBe(viewer);
  });

  it('shares with users by username', async () => {
    const { service, requests } = setup({ body: fixture.shareCreate.response });

    await service.shareWithUsers(1, { [viewer]: ['view'] });

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/data_cook/1/share', body: fixture.shareCreate.request });
  });

  it('edits shares by share id', async () => {
    const { service, requests } = setup({ body: fixture.shareUpdate.response });

    await service.editShares(1, { s_2: ['view'] });

    expect(requests[0]).toEqual({ method: 'PUT', url: 'http://api.test/data_cook/1/share/update', body: fixture.shareUpdate.request });
  });

  it('revokes users', async () => {
    const { service, requests } = setup({ body: fixture.shareRevoke.response });

    await service.revokeShares(1, [viewer]);

    expect(requests[0]).toEqual({ method: 'DELETE', url: 'http://api.test/data_cook/1/share/revoke', body: fixture.shareRevoke.request });
  });
});
