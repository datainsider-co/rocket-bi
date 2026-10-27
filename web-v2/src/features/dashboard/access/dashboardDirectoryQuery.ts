import { queryOptions } from '@tanstack/react-query';
import type { DashboardService } from '@/core/dashboard/DashboardService';
import type { DirectoryService } from '@/core/directory/DirectoryService';
import { dashboardKeys } from '../detail/dashboardQueries';

export const dashboardDirectoryKey = (dashboardId: number) => [...dashboardKeys.detail(dashboardId), 'directory'] as const;

/** A dashboard's directory entry: it holds the password, and Share works on it. */
export function dashboardDirectoryQueryOptions(dashboards: DashboardService, directories: DirectoryService, dashboardId: number) {
  return queryOptions({
    queryKey: dashboardDirectoryKey(dashboardId),
    queryFn: async () => directories.get(await dashboards.getDirectoryId(dashboardId))
  });
}
