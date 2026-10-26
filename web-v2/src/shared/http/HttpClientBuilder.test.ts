import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './ApiError';
import { HttpClientBuilder } from './HttpClientBuilder';

function fakeFetch(response: () => Response) {
  const requests: Request[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push(request);
    return response();
  });
  return { fetch, requests };
}

describe('HttpClientBuilder', () => {
  it('builds a client with the prefix and headers', async () => {
    const { fetch, requests } = fakeFetch(() => Response.json({ ok: true }));
    const client = new HttpClientBuilder('http://test.local/api')
      .withHeaders(() => ({ Authorization: 'session-1' }))
      .withFetch(fetch)
      .build();

    expect(await client.get('/user/profile/me').json()).toEqual({ ok: true });
    expect(requests[0]?.url).toBe('http://test.local/api/user/profile/me');
    expect(requests[0]?.headers.get('Authorization')).toBe('session-1');
  });

  it('passes the unauthenticated callback through', async () => {
    const { fetch } = fakeFetch(() => Response.json({ code: 401, reason: 'not_authenticated' }, { status: 401 }));
    const onUnauthenticated = vi.fn<(error: ApiError) => void>();
    const client = new HttpClientBuilder('http://test.local').onUnauthenticated(onUnauthenticated).withFetch(fetch).build();

    await expect(client.get('/x').json()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthenticated).toHaveBeenCalledOnce();
  });

  it('applies the timeout', async () => {
    const fetch = vi.fn<(request: Request) => Promise<Response>>(() => new Promise(() => {}));
    const client = new HttpClientBuilder('http://test.local').withTimeout(10).withFetch(fetch).build();

    await expect(client.get('/x').json()).rejects.toMatchObject({ reason: 'timeout' });
  });
});
