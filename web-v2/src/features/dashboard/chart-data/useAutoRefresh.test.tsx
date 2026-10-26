import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { useAutoRefresh } from './useAutoRefresh';
import { chartDataKeys } from './useWidgetData';

function setup(dashboardId: number | undefined, intervalMs: number | undefined) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useAutoRefresh(dashboardId, intervalMs), { wrapper });
  return { invalidate, hook };
}

describe('useAutoRefresh', () => {
  afterEach(() => vi.useRealTimers());

  it("re-queries the dashboard's charts each interval until unmounted", () => {
    vi.useFakeTimers();
    const { invalidate, hook } = setup(1, 15_000);
    vi.advanceTimersByTime(30_000);
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chartDataKeys.all(1) });
    hook.unmount();
    vi.advanceTimersByTime(30_000);
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('does nothing without an interval or a dashboard', () => {
    vi.useFakeTimers();
    expect(setup(1, undefined).invalidate).not.toHaveBeenCalled();
    const { invalidate } = setup(undefined, 15_000);
    vi.advanceTimersByTime(30_000);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
