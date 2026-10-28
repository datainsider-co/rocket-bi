/** A choice of v1 `RefreshButton`: reload the listing every `intervalMs`, or only on click when 0. */
export interface RefreshOption {
  readonly key: string;
  readonly label: string;
  readonly intervalMs: number;
}

/** v1 `JobStore.refreshOption`: every 5 seconds. */
export const DEFAULT_REFRESH_OPTION: RefreshOption = { key: '5s', label: 'Auto Refresh 5s', intervalMs: 5_000 };

/** v1 `RefreshButton.autoRefreshOptions`, in its order. */
export const REFRESH_OPTIONS: readonly RefreshOption[] = [
  DEFAULT_REFRESH_OPTION,
  { key: '15s', label: 'Auto Refresh 15s', intervalMs: 15_000 },
  { key: '30s', label: 'Auto Refresh 30s', intervalMs: 30_000 },
  { key: '1m', label: 'Auto Refresh 1m', intervalMs: 60_000 },
  { key: 'manual', label: 'Manual Refresh', intervalMs: 0 }
];

export function isAutoRefresh(option: RefreshOption): boolean {
  return option.intervalMs > 0;
}

/** TanStack Query `refetchInterval`: `false` turns polling off. */
export function toRefetchInterval(option: RefreshOption): number | false {
  return isAutoRefresh(option) ? option.intervalMs : false;
}

/** The option a menu key stands for; an unknown key keeps `current`. */
export function refreshOptionOf(key: string, current: RefreshOption): RefreshOption {
  return REFRESH_OPTIONS.find(option => option.key === key) ?? current;
}
