import { queryOptions } from '@tanstack/react-query';
import type { DashboardService } from '@/core/dashboard/DashboardService';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  detail: (id: number) => ['dashboard', id] as const
};

export function dashboardQueryOptions(service: DashboardService, id: number) {
  return queryOptions({
    queryKey: dashboardKeys.detail(id),
    queryFn: () => service.get(id)
  });
}
