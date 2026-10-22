import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { getSession, getShareToken } from '@/core/session/session';
import { notifySessionExpired } from '@/core/session/sessionExpired';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';

const TIMEOUT = 30_000;

export const HttpModule: DiModule = di => {
  di.bindValue(
    ApiClient,
    // In dev, Vite proxies `/api` to the gateway.
    new HttpClientBuilder(import.meta.env.VITE_API_PREFIX ?? '/api')
      .withTimeout(TIMEOUT)
      .withHeaders(() => ({ Authorization: getSession(), 'Token-Id': getShareToken() }))
      .onUnauthenticated(notifySessionExpired)
      .build()
  );
};
