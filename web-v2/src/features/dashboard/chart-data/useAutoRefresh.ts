import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chartDataKeys } from './useWidgetData';

/**
 * Re-queries every chart of the dashboard each `intervalMs` (v1 `DashboardControllerStore.applyAutoRefresh`), keeping
 * what they show until the new data comes; nothing while the tab is hidden or without an interval.
 */
export function useAutoRefresh(dashboardId: number | undefined, intervalMs: number | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (dashboardId === undefined || intervalMs === undefined) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void queryClient.invalidateQueries({ queryKey: chartDataKeys.all(dashboardId) });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [queryClient, dashboardId, intervalMs]);
}
