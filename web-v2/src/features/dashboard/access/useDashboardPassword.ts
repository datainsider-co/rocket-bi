import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import { dashboardDirectoryQueryOptions } from './dashboardDirectoryQuery';
import { needsPassword, passwordError } from './access.utils';

/** Checking the dashboard's directory, waiting for its password, or open. */
export type DashboardLock = 'checking' | 'locked' | 'open';

/**
 * A dashboard's password (v1 `PasswordModal.requirePassword`), kept on its directory entry. Asked again on every
 * visit, like v1. The check runs in the browser, as in v1: the server doesn't enforce it, so it only keeps the charts
 * from loading. A directory that can't be read counts as unprotected.
 */
export function useDashboardPassword(dashboard: Dashboard | undefined) {
  const dashboards = useDi(DashboardService);
  const directories = useDi(DirectoryService);
  const username = useCurrentUser().data?.userInfo.username;
  const [unlockedId, setUnlockedId] = useState<number>();
  const id = dashboard?.id ?? 0;
  const directory = useQuery({ ...dashboardDirectoryQueryOptions(dashboards, directories, id), enabled: dashboard !== undefined });

  const settled = directory.isSuccess || directory.isError;
  const required = directory.data !== undefined && dashboard !== undefined && needsPassword({ passwordEnabled: directory.data.passwordEnabled, ownerId: dashboard.ownerId }, username ?? '');
  const lock: DashboardLock = !settled || username === undefined ? 'checking' : required && unlockedId !== id ? 'locked' : 'open';

  /** Opens the dashboard when the password is right; else says why not. */
  const unlock = (password: string): string | undefined => {
    const error = passwordError(password, directory.data?.hashedPassword ?? '');
    if (!error) setUnlockedId(id);
    return error;
  };

  return { lock, unlock };
}
