import { createHttpClient } from '@/shared/http/createHttpClient';
import { getSession, getShareToken } from '@/core/session/session';
import { notifySessionExpired } from '@/core/session/sessionExpired';

/** All backend services sit behind one gateway. In dev, Vite proxies `/api` to it. */
export const httpClient = createHttpClient({
  prefix: import.meta.env.VITE_API_PREFIX ?? '/api',
  getHeaders: () => ({ Authorization: getSession(), 'Token-Id': getShareToken() }),
  onUnauthenticated: notifySessionExpired
});
