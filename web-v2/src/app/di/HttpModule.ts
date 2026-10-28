import type { DiModule } from '@/core/di/Container';
import { ApiClient, SchedulerClient } from '@/core/http/tokens';
import { getSession, getShareToken } from '@/core/session/session';
import { notifySessionExpired } from '@/core/session/sessionExpired';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';

const TIMEOUT = 30_000;

/**
 * The backend's default `schedule_service.access_token`. A shared secret every client sends, as v1 did; set
 * `VITE_SCHEDULER_ACCESS_TOKEN` when a deployment changes it.
 */
const DEFAULT_SCHEDULER_ACCESS_TOKEN = 'job$cheduler@datainsider.co';

function sessionHeaders(): Record<string, string | undefined> {
  return { Authorization: getSession(), 'Token-Id': getShareToken() };
}

export const HttpModule: DiModule = di => {
  // In dev, Vite proxies `/api` to the gateway.
  const prefix = import.meta.env.VITE_API_PREFIX ?? '/api';
  di.bindValue(
    ApiClient,
    new HttpClientBuilder(prefix).withTimeout(TIMEOUT).withHeaders(sessionHeaders).onUnauthenticated(notifySessionExpired).build()
  );
  const schedulerToken: string = import.meta.env.VITE_SCHEDULER_ACCESS_TOKEN ?? DEFAULT_SCHEDULER_ACCESS_TOKEN;
  di.bindValue(
    SchedulerClient,
    new HttpClientBuilder(prefix)
      .withTimeout(TIMEOUT)
      .withHeaders(() => ({ ...sessionHeaders(), 'access-token': schedulerToken }))
      .onUnauthenticated(notifySessionExpired)
      .build()
  );
};
