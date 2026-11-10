import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { PermissionService } from '@/core/permission/PermissionService';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import { ORG_PERMISSIONS, toOrgPermissions } from './organization.utils';

export const orgPermissionsKey = (username: string) => ['permission', username, 'organization-settings'] as const;

/**
 * What the logged-in user may do in Organization Settings, in one `is_permitted` request. `undefined` while loading.
 * v1 only hid the DataSource item; every other check was the server's.
 */
export function useOrganizationPermissions() {
  const service = useDi(PermissionService);
  const username = useCurrentUser().data?.userInfo.username ?? '';
  const query = useQuery({
    queryKey: orgPermissionsKey(username),
    queryFn: async () => toOrgPermissions(await service.isPermitted(username, ORG_PERMISSIONS)),
    enabled: username !== '',
    staleTime: Number.POSITIVE_INFINITY
  });
  return { permissions: query.data, isError: query.isError, error: query.error, refetch: query.refetch, username };
}
