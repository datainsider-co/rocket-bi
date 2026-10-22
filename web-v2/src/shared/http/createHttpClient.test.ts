import { describe, expect, it, vi } from 'vitest';
import { ApiError, ApiErrorReason } from './ApiError';
import { createHttpClient } from './createHttpClient';
import type { HttpClientOptions } from './createHttpClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function setup(respond: (request: Request) => Response | Promise<Response>, options?: Partial<HttpClientOptions>) {
  const requests: Request[] = [];
  const bodies: string[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push(request);
    bodies.push(await request.clone().text());
    return respond(request);
  });
  const client = createHttpClient({ prefix: 'http://test.local/api', fetch, ...options });
  return { client, requests, bodies, fetch };
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the request to fail');
}

describe('createHttpClient', () => {
  it('joins the prefix with origin-relative paths', async () => {
    const { client, requests } = setup(() => jsonResponse({}));

    await client.get('/user/profile/me').json();

    expect(requests[0]?.url).toBe('http://test.local/api/user/profile/me');
  });

  it('returns the body as-is, without renaming keys', async () => {
    const body = { full_name: 'A', column_map: { order_id: 1, 'Order Date': 2 } };
    const { client } = setup(() => jsonResponse(body));

    expect(await client.get('/x').json()).toEqual(body);
  });

  it('sends the json option unchanged', async () => {
    const { client, requests, bodies } = setup(() => jsonResponse({}));

    await client.post('/x', { json: { org_id: 1, someKey: 'a' } }).json();

    expect(JSON.parse(bodies[0] ?? '')).toEqual({ org_id: 1, someKey: 'a' });
    expect(requests[0]?.headers.get('Content-Type')).toContain('application/json');
  });

  it('parses an empty body to undefined', async () => {
    const { client } = setup(() => new Response('', { status: 200 }));

    expect(await client.delete('/x').json()).toBeUndefined();
  });

  it('adds non-empty headers from getHeaders on every request', async () => {
    let session: string | undefined = 'session-1';
    const { client, requests } = setup(() => jsonResponse({}), {
      getHeaders: () => ({ Authorization: session, 'Token-Id': undefined })
    });

    await client.get('/x').json();
    session = 'session-2';
    await client.get('/x').json();

    expect(requests[0]?.headers.get('Authorization')).toBe('session-1');
    expect(requests[1]?.headers.get('Authorization')).toBe('session-2');
    expect(requests[0]?.headers.has('Token-Id')).toBe(false);
  });

  it('turns an HTTP error into ApiError', async () => {
    const { client } = setup(() =>
      jsonResponse({ code: 400, reason: 'invalid_credentials', message: 'your credentials is not found' }, 400)
    );

    const error = await catchError(client.post('/user/auth/login', { json: {} }).json());

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, reason: 'invalid_credentials' });
  });

  it('calls onUnauthenticated for not_authenticated, then still throws', async () => {
    const onUnauthenticated = vi.fn<(error: ApiError) => void>();
    const { client } = setup(
      () => jsonResponse({ code: 401, reason: 'not_authenticated', message: 'expired' }, 401),
      { onUnauthenticated }
    );

    const error = await catchError(client.get('/user/profile/me').json());

    expect(onUnauthenticated).toHaveBeenCalledWith(error);
    expect(error).toMatchObject({ reason: ApiErrorReason.notAuthenticated });
  });

  it('does not call onUnauthenticated for other errors', async () => {
    const onUnauthenticated = vi.fn<(error: ApiError) => void>();
    const { client } = setup(() => jsonResponse({ code: 403, reason: 'not_allowed' }, 403), { onUnauthenticated });

    await catchError(client.get('/x').json());

    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it('does not retry failed requests', async () => {
    const { client, fetch } = setup(() => jsonResponse({}, 503));

    await catchError(client.get('/x').json());

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('turns a timeout into ApiError', async () => {
    const { client } = setup(() => new Promise<Response>(() => {}), { timeout: 10 });

    const error = await catchError(client.get('/x').json());

    expect(error).toMatchObject({ reason: ApiErrorReason.timeout });
  });

  it('turns a network failure into ApiError', async () => {
    const { client } = setup(() => Promise.reject(new TypeError('Failed to fetch')));

    const error = await catchError(client.get('/x').json());

    expect(error).toMatchObject({ reason: ApiErrorReason.network });
  });

  it('lets an abort through unchanged', async () => {
    const controller = new AbortController();
    const { client } = setup(
      request =>
        new Promise<Response>((_, reject) => {
          request.signal.addEventListener('abort', () => reject(request.signal.reason));
        })
    );

    const pending = catchError(client.get('/x', { signal: controller.signal }).json());
    controller.abort();
    const error = await pending;

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });
});
