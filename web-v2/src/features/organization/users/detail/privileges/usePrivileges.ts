import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { PermissionAdminService } from '@/core/admin/PermissionAdminService';
import {
  permissionChanges,
  setGroupAll,
  setPermission,
  storedCatalogPermissions,
  type PermissionGroup
} from '@/core/admin/permissionGroups';
import { PermissionService } from '@/core/permission/PermissionService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { userKeys, userPrivilegesQueryOptions } from '../../userQueries';

/**
 * The privileges editor (v1 `UserPrivilege`): ticks start from what the server grants, edits stay local until Save,
 * which sends only the groups that changed.
 */
export function usePrivileges({ user }: ManagedUserDetail, enabled: boolean) {
  const permissionService = useDi(PermissionService);
  const adminService = useDi(PermissionAdminService);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const query = useQuery({ ...userPrivilegesQueryOptions(permissionService, user.username), enabled });
  const [edits, setEdits] = useState<string[] | null>(null);
  const initial = query.data ?? [];
  const selection = edits ?? initial;
  const changes = permissionChanges(initial, selection, storedCatalogPermissions(user.permissions));
  const isDirty = changes.include.length > 0 || changes.exclude.length > 0;

  const save = useMutation({
    mutationFn: () => adminService.changePermissions(user.username, changes.include, changes.exclude),
    onSuccess: async () => {
      // Own permissions may have changed too, so every permission answer is asked again.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['permission'] })
      ]);
      setEdits(null);
      void message.success('Privileges saved');
    }
  });

  return {
    selection,
    isLoading: query.isPending && enabled,
    loadError: query.isError ? toErrorMessage(query.error) : undefined,
    isDirty,
    toggleAll: (group: PermissionGroup, checked: boolean) => setEdits(setGroupAll(selection, group, checked)),
    toggle: (group: PermissionGroup, permission: string, checked: boolean) =>
      setEdits(setPermission(selection, group, permission, checked)),
    reset: () => {
      save.reset();
      setEdits(null);
    },
    save: { run: () => save.mutate(), isPending: save.isPending, errorMessage: save.isError ? toErrorMessage(save.error) : undefined }
  };
}

export type PrivilegesControls = ReturnType<typeof usePrivileges>;
