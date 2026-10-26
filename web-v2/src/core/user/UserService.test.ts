import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { HttpUserService } from './UserService';

function setup(reply: unknown) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return Response.json(reply);
  });
  return { service: new HttpUserService(new HttpClientBuilder('http://api.test').withFetch(fetch).build()), requests };
}

describe('HttpUserService', () => {
  it('suggests users and keeps each profile as sent', async () => {
    // Reply of the local backend, with a property key that holds a dot.
    const root = { username: 'root', full_name: 'root', email: 'hello@gmail.com', gender: 0, properties: { 'team.region': 'Asia' } };
    const { service, requests } = setup({ total: 1, data: [root] });

    const page = await service.suggest('ro', 0, 100);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/user/profile/suggest' });
    expect(JSON.parse(requests[0]?.body ?? '')).toEqual({ keyword: 'ro', from: 0, size: 100 });
    expect(page.total).toBe(1);
    expect(page.users[0]?.profile.displayName).toBe('root');
    expect(page.users[0]?.json).toEqual(root);
  });

  it('reads an unexpected reply as no users', async () => {
    expect(await setup(null).service.suggest('', 0, 10)).toEqual({ total: 0, users: [] });
  });
});
