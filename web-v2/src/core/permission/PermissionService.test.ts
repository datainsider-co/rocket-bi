import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { HttpPermissionService } from './PermissionService';

function setup(reply: unknown) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return Response.json(reply);
  });
  const service = new HttpPermissionService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
  return { service, requests };
}

describe('HttpPermissionService', () => {
  it('asks the server and keeps permission names as keys', async () => {
    const { service, requests } = setup({ 'organization:manage:connection': true, 'a:b': false });

    const answers = await service.isPermitted('root', ['organization:manage:connection', 'a:b']);

    expect(answers).toEqual({ 'organization:manage:connection': true, 'a:b': false });
    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/admin/permissions/root/is_permitted' });
    expect(JSON.parse(requests[0]?.body ?? '')).toEqual({
      username: 'root',
      permissions: ['organization:manage:connection', 'a:b']
    });
  });

  it('encodes the username in the path', async () => {
    const { service, requests } = setup({});

    await service.isPermitted('a/b', []);

    expect(requests[0]?.url).toBe('http://api.test/admin/permissions/a%2Fb/is_permitted');
  });

  it('ignores answers that are not booleans', async () => {
    const { service } = setup({ x: 'yes', y: true });

    await expect(service.isPermitted('root', ['x', 'y'])).resolves.toEqual({ y: true });
  });
});
