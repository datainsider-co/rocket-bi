import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContainer } from '@/core/di/Container';
import { ApiClient, SchedulerClient } from '@/core/http/tokens';
import { clearSession, saveSession } from '@/core/session/session';
import { HttpModule } from './HttpModule';

describe('HttpModule', () => {
  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  // Node's Request can't resolve a relative URL the way a browser does, so the test uses an absolute prefix.
  it('binds an ApiClient with VITE_API_PREFIX that sends the session', async () => {
    vi.stubEnv('VITE_API_PREFIX', 'http://gateway.test/api');
    const requests: Request[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<(request: Request) => Promise<Response>>(async request => {
        requests.push(request);
        return Response.json({});
      })
    );
    saveSession('session-1', 60);

    await createContainer([HttpModule]).get(ApiClient).get('/user/profile/me').json();

    expect(requests[0]?.url).toBe('http://gateway.test/api/user/profile/me');
    expect(requests[0]?.headers.get('Authorization')).toBe('session-1');
    expect(requests[0]?.headers.get('access-token')).toBeNull();
  });

  it.each([
    [undefined, 'job$cheduler@datainsider.co'],
    ['other-token', 'other-token']
  ])('binds a SchedulerClient that also sends the access token (VITE_SCHEDULER_ACCESS_TOKEN %j)', async (env, expected) => {
    vi.stubEnv('VITE_API_PREFIX', 'http://gateway.test/api');
    if (env) vi.stubEnv('VITE_SCHEDULER_ACCESS_TOKEN', env);
    const requests: Request[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<(request: Request) => Promise<Response>>(async request => {
        requests.push(request);
        return Response.json({});
      })
    );
    saveSession('session-1', 60);

    await createContainer([HttpModule]).get(SchedulerClient).post('job/list').json();

    expect(requests[0]?.url).toBe('http://gateway.test/api/job/list');
    expect(requests[0]?.headers.get('Authorization')).toBe('session-1');
    expect(requests[0]?.headers.get('access-token')).toBe(expected);
  });
});
