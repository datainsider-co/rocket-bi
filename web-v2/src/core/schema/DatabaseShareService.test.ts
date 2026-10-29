import { describe, expect, it } from 'vitest';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import { HttpDatabaseShareService } from './DatabaseShareService';
import fixture from './warehouse.fixture.json';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpDatabaseShareService(http), requests };
}

const viewer = 'up-860803c8-e3be-4afb-b88b-743817456dfc';

describe('HttpDatabaseShareService', () => {
  it('reads who the database is shared with', async () => {
    const { service, requests } = setup({ body: fixture.shareListAfterCreate.response });

    const sharing = await service.getSharing('dw0_probe');

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/databases/dw0_probe/share/list' });
    expect(sharing.owner.username).toBe('root');
    expect(sharing.usersSharing[0]).toMatchObject({ id: 's_5', permissions: ['0:database:view:dw0_probe'] });
    expect(sharing.usersSharing[0]?.user.username).toBe(viewer);
  });

  it('shares with users by username', async () => {
    const { service, requests } = setup({ body: fixture.shareCreate.response });

    await service.shareWithUsers('dw0_probe', { [viewer]: ['view'] });

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/databases/dw0_probe/share', body: fixture.shareCreate.request });
  });

  it('edits shares by share id', async () => {
    const { service, requests } = setup({ body: {} });

    await service.editShares('dw0_probe', { s_5: ['view'] });

    expect(requests[0]).toEqual({
      method: 'PUT',
      url: 'http://api.test/databases/dw0_probe/share/update',
      body: { resource_type: 'database', resource_id: 'dw0_probe', share_id_actions: { s_5: ['view'] } }
    });
  });

  it('revokes shares', async () => {
    const { service, requests } = setup({ body: fixture.shareRevoke.response });

    await service.revokeShares('dw0_probe', [viewer]);

    expect(requests[0]).toEqual({ method: 'DELETE', url: 'http://api.test/databases/dw0_probe/share/revoke', body: fixture.shareRevoke.request });
  });
});
