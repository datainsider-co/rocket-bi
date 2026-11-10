import { describe, expect, it } from 'vitest';
import { fakeHttp } from '@/test/fakeHttp';
import fixture from './admin.fixture.json';
import { DEFAULT_GOOGLE_LOGIN_METHOD } from './LoginMethod';
import { HttpLoginMethodService } from './LoginMethodService';

describe('HttpLoginMethodService', () => {
  it('reads the Google entry', async () => {
    const { http } = fakeHttp({ body: fixture.loginMethodsAfterUpdate.response });

    const method = await new HttpLoginMethodService(http).getGoogle();

    expect(method).toMatchObject({ name: 'Google', isActive: false, whitelistEmail: ['example.com'] });
    expect(method.clientId).toMatch(/apps\.googleusercontent\.com$/);
  });

  it('falls back to the default without a Google entry', async () => {
    const { http } = fakeHttp({ body: {} });

    await expect(new HttpLoginMethodService(http).getGoogle()).resolves.toBe(DEFAULT_GOOGLE_LOGIN_METHOD);
  });

  it('saves under gg without the server-computed valid flag', async () => {
    const { http, requests } = fakeHttp({ body: fixture.loginMethods.response }, { body: fixture.updateLoginMethods.response });
    const service = new HttpLoginMethodService(http);
    const method = await service.getGoogle();

    const saved = await service.saveGoogle({ ...method, whitelistEmail: ['example.com'], isActive: true });

    expect(requests[1]).toMatchObject({ method: 'PUT', url: 'http://api.test/admin/setting/login_methods' });
    expect(requests[1]?.body).toEqual({
      gg: {
        name: 'Google',
        oauth_type: 'gg',
        client_ids: [method.clientId],
        whitelist_email: ['example.com'],
        is_active: true,
        organization_id: 0
      }
    });
    expect(saved.whitelistEmail).toEqual(['example.com']);
  });
});
