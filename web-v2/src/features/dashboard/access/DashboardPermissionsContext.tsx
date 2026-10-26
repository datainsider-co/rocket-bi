import { createContext, use, type ReactNode } from 'react';
import type { DashboardPermissions } from './access.utils';

const DashboardPermissionsContext = createContext<DashboardPermissions | null>(null);

interface DashboardPermissionsProviderProps {
  permissions: DashboardPermissions;
  children: ReactNode;
}

/** The viewer's permissions for the widgets of one dashboard (v1 `DashboardModeStore.actionTypes`). */
export function DashboardPermissionsProvider({ permissions, children }: DashboardPermissionsProviderProps) {
  return <DashboardPermissionsContext value={permissions}>{children}</DashboardPermissionsContext>;
}

export function useDashboardPermissions(): DashboardPermissions {
  const permissions = use(DashboardPermissionsContext);
  if (!permissions) {
    throw new Error('useDashboardPermissions must be used inside <DashboardPermissionsProvider>');
  }
  return permissions;
}
