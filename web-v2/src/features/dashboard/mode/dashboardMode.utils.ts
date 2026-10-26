/**
 * How the dashboard is shown (v1 `DashboardMode` View, ViewFullScreen, TVMode): with the app around it, over the whole
 * window, or over the whole screen and scaled to fit its height.
 */
export const DashboardMode = {
  View: 'view',
  FullScreen: 'fullscreen',
  Tv: 'tv'
} as const;

export type DashboardMode = (typeof DashboardMode)[keyof typeof DashboardMode];

/** v1 `onFullscreenChange`: shrink a dashboard taller than the screen so it fits, never grow it. */
export function fitScale(contentHeight: number, viewportHeight: number): number {
  if (contentHeight <= 0 || viewportHeight <= 0) return 1;
  return Math.min(1, viewportHeight / contentHeight);
}

/** v1 `RecurringMethodExecutor` started only for a positive interval with auto refresh on. */
export function refreshIntervalOf(setting: { isAutoRefresh: boolean; refreshIntervalMs: number }): number | undefined {
  return setting.isAutoRefresh && setting.refreshIntervalMs > 0 ? setting.refreshIntervalMs : undefined;
}
