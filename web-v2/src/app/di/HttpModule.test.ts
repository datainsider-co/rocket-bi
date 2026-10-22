import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContainer } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
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
  });
});
