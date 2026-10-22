import { describe, expect, it, vi } from 'vitest';
import { ApiError, ApiErrorReason } from '@/shared/http/ApiError';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { HttpAuthenticationService } from './AuthenticationService';

type Reply = { status?: number; body?: unknown };

function setup(reply: Reply = {}) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return reply.body === undefined
      ? new Response('', { status: reply.status ?? 200 })
      : Response.json(reply.body, { status: reply.status ?? 200 });
  });
  const service = new HttpAuthenticationService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
  const body = (index = 0) => JSON.parse(requests[index]?.body || 'null') as unknown;
  return { service, requests, body };
}

describe('HttpAuthenticationService', () => {
  it('logs in with email and password only and maps the response', async () => {
    const { service, requests, body } = setup({ body: { session: { value: 's-1', max_age: 60 } } });

    const response = await service.login('a@b.c', 'secret');

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/user/auth/login' });
    expect(body()).toEqual({ email: 'a@b.c', password: 'secret' });
    expect(response.session).toMatchObject({ value: 's-1', maxAge: 60 });
  });

  it('checks the session', async () => {
    const { service, requests } = setup({ body: { user_profile: { username: 'root' } } });

    const response = await service.checkSession();

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/user/auth/check_session' });
    expect(response.userProfile.username).toBe('root');
  });

  it('logs out', async () => {
    const { service, requests } = setup({ body: true });

    await service.logout();

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/user/auth/logout' });
  });

  it('asks for a reset code', async () => {
    const { service, requests, body } = setup({ body: true });

    await service.forgotPassword('a@b.c');

    expect(requests[0]?.url).toBe('http://api.test/user/auth/forgot_password');
    expect(body()).toEqual({ email: 'a@b.c' });
  });

  it('accepts a valid code', async () => {
    const { service, requests, body } = setup({ body: { success: true } });

    await service.verifyCode('a@b.c', '123456');

    expect(requests[0]?.url).toBe('http://api.test/user/auth/123456/status');
    expect(body()).toEqual({ email: 'a@b.c' });
  });

  it('turns a 200 { success: false } into verification_code_invalid', async () => {
    const { service } = setup({ body: { success: false, message: 'No code was found.' } });

    const error = await service.verifyCode('a@b.c', '000000').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ reason: ApiErrorReason.verificationCodeInvalid, message: 'No code was found.' });
  });

  it('sends the reset request in snake_case', async () => {
    const { service, requests, body } = setup({ body: true });

    await service.resetPassword({ email: 'a@b.c', newPassword: 'newpass', verifyCode: '123456' });

    expect(requests[0]?.url).toBe('http://api.test/user/auth/reset_password');
    expect(body()).toEqual({ email: 'a@b.c', new_password: 'newpass', verify_code: '123456' });
  });

  it('passes API errors through', async () => {
    const { service } = setup({ status: 400, body: { code: 400, reason: 'email_not_existed', message: 'Email Not Exists' } });

    await expect(service.forgotPassword('x@y.z')).rejects.toMatchObject({ reason: 'email_not_existed' });
  });
});
