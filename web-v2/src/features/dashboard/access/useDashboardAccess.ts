import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { DashboardPermissions } from './access.utils';
import { useDashboardPassword, type DashboardLock } from './useDashboardPassword';
import { useDashboardPermissionsQuery } from './useDashboardPermissionsQuery';

export interface DashboardAccess {
  lock: DashboardLock;
  onUnlock: (password: string) => string | undefined;
  permissions: DashboardPermissions;
}

/** Whether the viewer may see the dashboard yet, and what they may do on it. */
export function useDashboardAccess(dashboard: Dashboard | undefined): DashboardAccess {
  const { lock, unlock } = useDashboardPassword(dashboard);
  const permissions = useDashboardPermissionsQuery(dashboard);
  return { lock, onUnlock: unlock, permissions };
}
