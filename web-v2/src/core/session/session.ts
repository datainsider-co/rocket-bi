/** Same cookie as v1 (`DataManager`), so both apps share one login when served on the same domain. */
const SESSION_COOKIE = 'ssid';
/** Query param that carries the token of a shared link. */
const SHARE_TOKEN_PARAM = 'token';

export function readCookie(cookies: string, name: string): string | undefined {
  const prefix = `${name}=`;
  for (const cookie of cookies.split(';')) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length)) || undefined;
    }
  }
  return undefined;
}

export function getSession(): string | undefined {
  return readCookie(document.cookie, SESSION_COOKIE);
}

export function saveSession(sessionId: string, maxAgeSeconds: number): void {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(sessionId)};max-age=${maxAgeSeconds};path=/`;
}

export function clearSession(): void {
  document.cookie = `${SESSION_COOKIE}=;max-age=0;path=/`;
}

export function getShareToken(search: string = window.location.search): string | undefined {
  return new URLSearchParams(search).get(SHARE_TOKEN_PARAM) || undefined;
}
