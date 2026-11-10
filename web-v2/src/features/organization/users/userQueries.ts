import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { PermissionService } from '@/core/permission/PermissionService';
import { CATALOG_PERMISSIONS, selectionFromPermitted } from '@/core/admin/permissionGroups';
import type { LoginMethodService } from '@/core/admin/LoginMethodService';
import type { UserAdminService, UserSearch } from '@/core/admin/UserAdminService';

/** Everything about managed users is invalidated together once one of them changes. */
export const userKeys = {
  all: ['admin-users'] as const,
  list: (search: UserSearch) => ['admin-users', 'list', search] as const,
  detail: (username: string) => ['admin-users', 'detail', username] as const,
  privileges: (username: string) => ['admin-users', 'privileges', username] as const
};

export const googleLoginMethodKey = ['login-method', 'google'] as const;

export function usersQueryOptions(service: UserAdminService, search: UserSearch) {
  return queryOptions({
    queryKey: userKeys.list(search),
    queryFn: () => service.search(search),
    placeholderData: keepPreviousData
  });
}

export function userDetailQueryOptions(service: UserAdminService, username: string) {
  return queryOptions({ queryKey: userKeys.detail(username), queryFn: () => service.get(username) });
}

/** The catalog permissions the user has, as the server resolves them (wildcards included). */
export function userPrivilegesQueryOptions(service: PermissionService, username: string) {
  return queryOptions({
    queryKey: userKeys.privileges(username),
    queryFn: async () => selectionFromPermitted(await service.isPermitted(username, CATALOG_PERMISSIONS))
  });
}

export function googleLoginMethodQueryOptions(service: LoginMethodService) {
  return queryOptions({ queryKey: googleLoginMethodKey, queryFn: () => service.getGoogle() });
}
