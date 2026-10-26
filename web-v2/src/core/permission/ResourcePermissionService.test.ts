import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { ALL_RESOURCE_ACTIONS, HttpResourcePermissionService } from './ResourcePermissionService';

function setup(reply: unknown) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return Response.json(reply);
  });
  return { service: new HttpResourcePermissionService(new HttpClientBuilder('http://api.test').withFetch(fetch).build()), requests };
}

describe('HttpResourcePermissionService', () => {
  it('keeps the actions answered true', async () => {
    // Reply of the local backend for a user who may view and download.
    const { service, requests } = setup({ '*': false, view: true, download: true, edit: false, copy: false, delete: false, create: false });

    expect(await service.permittedActions('dashboard', 1, ALL_RESOURCE_ACTIONS)).toEqual(['view', 'download']);
    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/share/dashboard/1/action_permitted' });
    // Body accepted by the local backend.
    expect(JSON.parse(requests[0]?.body ?? '')).toEqual({ resource_type: 'dashboard', resource_id: '1', actions: ALL_RESOURCE_ACTIONS });
  });

  it('grants nothing for an unexpected reply', async () => {
    expect(await setup(null).service.permittedActions('dashboard', 1, ['view'])).toEqual([]);
  });
});
