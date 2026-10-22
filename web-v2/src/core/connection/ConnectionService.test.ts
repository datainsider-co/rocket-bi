import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { ClickhouseConnection } from './ClickhouseConnection';
import { HttpConnectionService } from './ConnectionService';

type Reply = { status?: number; body?: unknown };

/** Answers each request with the next reply; the last one repeats. */
function setup(...replies: Reply[]) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    const reply = replies[Math.min(requests.length - 1, replies.length - 1)] ?? {};
    return reply.body === undefined
      ? new Response('', { status: reply.status ?? 200 })
      : Response.json(reply.body, { status: reply.status ?? 200 });
  });
  const service = new HttpConnectionService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
  const body = (index = 0) => JSON.parse(requests[index]?.body || 'null') as unknown;
  return { service, requests, body };
}

describe('HttpConnectionService', () => {
  it.each([
    [{ existed: true }, true],
    [{ existed: false }, false],
    [{}, false]
  ])('reads %j from connection/exist', async (reply, expected) => {
    const { service, requests } = setup({ body: reply });

    await expect(service.exists()).resolves.toBe(expected);
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/connection/exist' });
  });

  it('gets the connection', async () => {
    const { service } = setup({ body: { class_name: 'mysql_connection', host: 'db', port: 3306 } });

    await expect(service.get()).resolves.toMatchObject({ host: 'db', port: 3306 });
  });

  it('fails when there is no connection', async () => {
    const { service } = setup({ status: 404, body: { code: 404, reason: 'not_found', message: 'not found' } });

    await expect(service.get()).rejects.toMatchObject({ status: 404, reason: 'not_found' });
  });

  it('saves the connection wrapped in source', async () => {
    const { service, requests, body } = setup({ body: { class_name: 'clickhouse_connection' } });

    await service.save(new ClickhouseConnection({ host: 'h', http_port: 8123 }));

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/connection' });
    expect(body()).toMatchObject({ source: { class_name: 'clickhouse_connection', host: 'h', http_port: 8123 } });
  });

  it('tests the connection', async () => {
    const { service, requests, body } = setup({ body: { success: true } });

    await service.test(new ClickhouseConnection({ host: 'h' }));

    expect(requests[0]?.url).toBe('http://api.test/connection/test');
    expect(body()).toMatchObject({ source: { host: 'h' } });
  });

  it('passes on the driver message of a failed test', async () => {
    const message = 'Error while testing connection, cause: Communications link failure';
    const { service } = setup({ status: 500, body: { code: 500, reason: 'db_execute_error', message } });

    await expect(service.test(new ClickhouseConnection())).rejects.toMatchObject({ message });
  });

  it('fails a test answered with success false', async () => {
    const { service } = setup({ body: { success: false } });

    await expect(service.test(new ClickhouseConnection())).rejects.toThrow('Cannot connect');
  });

  it('starts a schema refresh', async () => {
    const { service, requests } = setup({ body: { success: true } });

    await service.refreshSchema();

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/connection/refresh-schema' });
  });

  it('reads the refresh history', async () => {
    const { service } = setup({
      body: { id: 3, is_first_run: true, status: 'running', stages: [{ name: 'scan_database', progress: 2, total: 5 }] }
    });

    const history = await service.getRefreshHistory();

    expect(history).toMatchObject({ id: 3, isFirstRun: true, isRunning: true });
    expect(history.stages[0]).toMatchObject({ name: 'scan_database', progress: 2, total: 5 });
  });

  it('returns the existing SSH public key', async () => {
    const { service, requests } = setup({ body: { is_exists: true, public_key: 'ssh-rsa AAA' } });

    await expect(service.getSshPublicKey()).resolves.toBe('ssh-rsa AAA');
    expect(requests).toHaveLength(1);
  });

  it('generates the SSH key pair when there is none', async () => {
    const { service, requests } = setup(
      { body: { is_exists: false } },
      { body: { success: true } },
      { body: { is_exists: true, public_key: 'ssh-rsa NEW' } }
    );

    await expect(service.getSshPublicKey()).resolves.toBe('ssh-rsa NEW');
    expect(requests.map(r => `${r.method} ${r.url}`)).toEqual([
      'GET http://api.test/connection/ssh/public-key',
      'POST http://api.test/connection/ssh/generate-key',
      'GET http://api.test/connection/ssh/public-key'
    ]);
  });

  it('fails when the generated key still does not exist', async () => {
    const { service } = setup({ body: { is_exists: false } }, { body: { success: false } }, { body: { is_exists: false } });

    await expect(service.getSshPublicKey()).rejects.toThrow('Cannot create the SSH key');
  });
});
