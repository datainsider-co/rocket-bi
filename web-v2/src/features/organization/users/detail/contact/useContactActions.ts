import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { PermissionAdminService } from '@/core/admin/PermissionAdminService';
import { UserAdminService } from '@/core/admin/UserAdminService';
import { UserGroup } from '@/core/admin/UserGroup';
import { permissionsToDropForViewer, storedCatalogPermissions } from '@/core/admin/permissionGroups';
import { asString } from '@/core/json/json';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { userKeys } from '../../userQueries';
import { resetPasswordText, roleChangeText } from './contact.utils';

const DEFAULT_PASSWORD = asString(import.meta.env['VITE_DEFAULT_PASSWORD']);

/** Suspend / Unsuspend, Reset Password and the role, each after v1's confirm. */
export function useContactActions({ user, profile }: ManagedUserDetail) {
  const users = useDi(UserAdminService);
  const permissions = useDi(PermissionAdminService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const { username } = user;
  const name = profile.displayName;
  const onError = (error: Error) => void message.error(toErrorMessage(error));
  const refresh = () => queryClient.invalidateQueries({ queryKey: userKeys.all });

  const setActive = useMutation({
    mutationFn: (active: boolean) => (active ? users.activate(username) : users.deactivate(username)),
    onSuccess: refresh,
    onError
  });
  const resetPassword = useMutation({
    mutationFn: () => users.resetPassword(username),
    onSuccess: () => void modal.success({ title: 'Password reset', content: resetPasswordText(DEFAULT_PASSWORD) }),
    onError
  });
  const changeRole = useMutation({
    mutationFn: async ({ to, dropped }: { to: UserGroup; dropped: readonly string[] }) => {
      await permissions.changeGroup(username, to);
      if (dropped.length > 0) await permissions.changePermissions(username, [], dropped);
    },
    onSuccess: refresh,
    onError
  });

  return {
    isPending: setActive.isPending || resetPassword.isPending || changeRole.isPending,
    toggleActive: () => {
      const active = !user.isActive;
      void modal.confirm({
        title: active ? 'Unsuspend User' : 'Suspend User',
        content: active ? `${name} will be able to log in again.` : `${name} won't be able to log in until unsuspended.`,
        okText: active ? 'Unsuspend' : 'Suspend',
        okButtonProps: { danger: !active },
        onOk: () => setActive.mutateAsync(active).catch(() => undefined)
      });
    },
    resetPassword: () =>
      void modal.confirm({
        title: 'Reset Password',
        content: `Reset the password of ${name}?`,
        okText: 'Reset',
        onOk: () => resetPassword.mutateAsync().catch(() => undefined)
      }),
    changeRole: (to: UserGroup) => {
      const dropped = to === UserGroup.Viewer ? permissionsToDropForViewer(storedCatalogPermissions(user.permissions)) : [];
      void modal.confirm({
        title: 'Change Role',
        content: roleChangeText(name, to, dropped),
        okText: 'Change',
        onOk: () => changeRole.mutateAsync({ to, dropped }).catch(() => undefined)
      });
    }
  };
}

export type ContactActions = ReturnType<typeof useContactActions>;
