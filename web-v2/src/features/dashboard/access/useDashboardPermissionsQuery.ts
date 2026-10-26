import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { ALL_RESOURCE_ACTIONS, ResourcePermissionService } from '@/core/permission/ResourcePermissionService';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import { dashboardKeys } from '../detail/dashboardQueries';
import { OWNER_PERMISSIONS, permissionsOf, VIEW_ONLY, type DashboardPermissions } from './access.utils';

/**
 * The viewer's permissions on the dashboard (v1 `DashboardDetail.loadPermissions`): all of them for the owner, else
 * what `share/dashboard/{id}/action_permitted` grants; view only until it answers.
 */
export function useDashboardPermissionsQuery(dashboard: Dashboard | undefined): DashboardPermissions {
  const service = useDi(ResourcePermissionService);
  const username = useCurrentUser().data?.userInfo.username;
  const id = dashboard?.id ?? 0;
  const isOwner = dashboard !== undefined && username === dashboard.ownerId;
  const query = useQuery({
    queryKey: [...dashboardKeys.detail(id), 'permissions'],
    queryFn: () => service.permittedActions('dashboard', id, ALL_RESOURCE_ACTIONS),
    enabled: dashboard !== undefined && username !== undefined && !isOwner
  });
  const granted = useMemo(() => (query.data ? permissionsOf(query.data) : VIEW_ONLY), [query.data]);
  return isOwner ? OWNER_PERMISSIONS : granted;
}
