import { DIException } from '@core/common/domain/exception';

export abstract class CookieManger {
  /**
   * @deprecated not implement
   */
  abstract put(key: string, value: string, dayExprire?: number, path?: string): boolean;

  abstract putMaxAge(key: string, value: string, maxAge?: number, path?: string): boolean;

  abstract get(key: string): string | undefined;

  abstract clear(): any;

  abstract remove(key: string, path?: string): boolean;
}

export class CookieMangerImpl extends CookieManger {
  put(key: string, value: string, dayExpire = 10, path = '/'): boolean {
    throw new DIException('method CookieMangerImpl::put cookie not implement');
  }

  get(key: string): string | undefined {
    const nameLenPlus = key.length + 1;
    return (
      document.cookie
        .split(';')
        .map(c => c.trim())
        .filter(cookie => {
          return cookie.substring(0, nameLenPlus) === `${key}=`;
        })
        .map(cookie => {
          return decodeURIComponent(cookie.substring(nameLenPlus));
        })[0] || void 0
    );
  }

  remove(key: string, path?: string): boolean {
    const date = new Date();
    // Set it expire in -1 days
    date.setTime(date.getTime() + -1 * 24 * 60 * 60 * 1000);
    // Set it
    if (path) {
      document.cookie = `${key}=;expires=${date.toUTCString()};path=${path}`;
    } else {
      document.cookie = `${key}=;expires=${date.toUTCString()};`;
      document.cookie = `${key}=;expires=${date.toUTCString()};path=/`;
    }

    return true;
  }

  clear(): void {
    document.cookie.split(';').forEach(cookie => {
      const key = cookie.split('=')[0];
      this.remove(key);
    });
  }

  putMaxAge(key: string, value: string, maxAge?: number, path?: string): boolean {
    document.cookie = `${key}=${value};max-age=${maxAge};path=${path ?? '/'}`;
    return true;
  }
}
