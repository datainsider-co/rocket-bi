import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createSessionExpiredHandler } from './sessionExpiredHandler';

function setup(path = '/dashboard/1?tab=a') {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['me'], { id: 1 });
  const clearSession = vi.fn<() => void>();
  const redirect = vi.fn<(href: string) => void>();
  const handle = createSessionExpiredHandler({ queryClient, clearSession, currentPath: () => path, redirect });
  return { queryClient, clearSession, redirect, handle };
}

describe('createSessionExpiredHandler', () => {
  it('clears the session and the query cache, then goes to login with the current path', () => {
    const { queryClient, clearSession, redirect, handle } = setup();

    handle();

    expect(clearSession).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(['me'])).toBeUndefined();
    expect(redirect).toHaveBeenCalledWith('/login?redirect=%2Fdashboard%2F1%3Ftab%3Da');
  });

  it('runs only once when many requests fail together', () => {
    const { clearSession, redirect, handle } = setup();

    handle();
    handle();
    handle();

    expect(clearSession).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
  });
});
