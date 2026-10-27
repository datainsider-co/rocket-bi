import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { HttpShareService } from './ShareService';

function setup(reply: unknown, status = 200) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return reply === undefined ? new Response(null, { status }) : Response.json(reply, { status });
  });
  const service = new HttpShareService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
  return { service, requests, sent: () => JSON.parse(requests[0]?.body || 'null') as unknown };
}

const folder = { type: 'directory', id: 7 } as const;
// A username of the local backend, kept as a map key.
const USERNAME = 'up-4b6dcb7f-1c8e-4895-8c81-33372edfdb60';

describe('HttpShareService', () => {
  it('gets the owner and the users a resource is shared with', async () => {
    // Reply of the local backend.
    const { service, requests } = setup({
      owner: { username: 'root', full_name: 'root', email: 'hello@gmail.com', gender: 0 },
      total_user_sharing: 1,
      users_sharing: [
        {
          id: 's_1',
          user: { username: USERNAME, full_name: 'M7b Tester', email: 'm7b.share@example.com', properties: {} },
          permissions: ['0:directory:view:7'],
          created_at: 1793036603925,
          updated_at: 1793036603925,
          created_by: 'root'
        }
      ]
    });

    const sharing = await service.getSharing(folder, 0, 100);

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/share/directory/7?from=0&size=100' });
    expect(sharing.owner.username).toBe('root');
    expect(sharing.totalUserSharing).toBe(1);
    expect(sharing.usersSharing[0]).toMatchObject({
      id: 's_1',
      permissions: ['0:directory:view:7'],
      createdAt: 1793036603925,
      createdBy: 'root'
    });
    expect(sharing.usersSharing[0]?.user.displayName).toBe('M7b Tester');
  });

  it('shares with users, actions keyed by username', async () => {
    const { service, requests, sent } = setup({ [USERNAME]: true });

    await service.shareWithUsers(folder, { [USERNAME]: ['view'] });

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/share/directory/7' });
    // Body accepted by the local backend.
    expect(sent()).toEqual({ resource_type: 'directory', resource_id: '7', user_actions: { [USERNAME]: ['view'] } });
  });

  it('edits shares, actions keyed by share id', async () => {
    const { service, requests, sent } = setup({ [USERNAME]: true });

    await service.editShares(folder, { s_3: ['view', 'download'] });

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/share/directory/7/edit' });
    expect(sent()).toEqual({ resource_type: 'directory', resource_id: '7', share_id_actions: { s_3: ['view', 'download'] } });
  });

  it('revokes shares with the usernames in the body', async () => {
    const { service, requests, sent } = setup({ [USERNAME]: true });

    await service.revokeShares(folder, [USERNAME]);

    expect(requests[0]).toMatchObject({ method: 'DELETE', url: 'http://api.test/share/directory/7/revoke' });
    expect(sent()).toEqual({ resource_type: 'directory', resource_id: '7', usernames: [USERNAME] });
  });

  it('reads the link', async () => {
    const { service, requests } = setup({
      token_id: '504fcdb8-3bc0-4b09-823a-77cffa0de74b',
      creator: 'root',
      permissions: ['0:directory:view:8'],
      created_time: 1793036572789
    });

    const link = await service.getLink({ type: 'directory', id: 8 });

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/share/directory/8/anyone' });
    expect(link).toMatchObject({ tokenId: '504fcdb8-3bc0-4b09-823a-77cffa0de74b', creator: 'root', permissions: ['0:directory:view:8'] });
  });

  it('reads no link as null when the server answers 404 with an empty body', async () => {
    expect(await setup(undefined, 404).service.getLink(folder)).toBeNull();
  });

  it('fails on other errors while reading the link', async () => {
    await expect(setup({ code: 403, reason: 'not_allowed', message: 'No permission' }, 403).service.getLink(folder)).rejects.toThrow(
      'No permission'
    );
  });

  it('creates a link', async () => {
    const { service, requests, sent } = setup({ token_id: 't1', creator: 'root', permissions: ['0:directory:view:8'], created_time: 1 });

    const link = await service.createLink({ type: 'directory', id: 8 }, ['view']);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/share/directory/8/anyone' });
    expect(sent()).toEqual({ resource_type: 'directory', resource_id: '8', actions: ['view'] });
    expect(link.tokenId).toBe('t1');
  });

  it('updates the link actions', async () => {
    const { service, requests, sent } = setup(true);

    await service.updateLink({ type: 'directory', id: 8 }, ['view', 'download']);

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/share/directory/8/anyone' });
    expect(sent()).toEqual({ resource_type: 'directory', resource_id: '8', actions: ['view', 'download'] });
  });

  it('revokes the link', async () => {
    const { service, requests } = setup(true);

    await service.revokeLink({ type: 'directory', id: 8 });

    expect(requests[0]).toMatchObject({ method: 'DELETE', url: 'http://api.test/share/directory/8/anyone/revoke' });
  });
});
