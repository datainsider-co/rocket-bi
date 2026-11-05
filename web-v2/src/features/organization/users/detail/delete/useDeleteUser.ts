import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { UserAdminService } from '@/core/admin/UserAdminService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { userKeys } from '../../userQueries';
import { deleteChoiceError, deleteConfirmText, transferEmail, type DeleteUserChoice } from './deleteUser.utils';

/** v1 `UserDeletion`: transfer the data or delete it, then the user, after a confirm. */
export function useDeleteUser({ user, profile }: ManagedUserDetail, onDeleted: () => void) {
  const service = useDi(UserAdminService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const [choice, setChoice] = useState<DeleteUserChoice>({ mode: 'transfer', transferTo: undefined });
  const [showError, setShowError] = useState(false);
  const error = deleteChoiceError(choice, profile.email);

  const remove = useMutation({
    mutationFn: () => service.delete(user.username, transferEmail(choice)),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: userKeys.detail(user.username) });
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      void message.success(`${profile.displayName} was deleted`);
      onDeleted();
    }
  });

  return {
    choice,
    setChoice: (next: DeleteUserChoice) => {
      remove.reset();
      setChoice(next);
    },
    error: showError ? error : undefined,
    isPending: remove.isPending,
    errorMessage: remove.isError ? toErrorMessage(remove.error) : undefined,
    submit: () => {
      setShowError(true);
      if (error) return;
      void modal.confirm({
        title: 'Delete User',
        content: deleteConfirmText(choice, profile.displayName),
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: () => remove.mutateAsync().catch(() => undefined)
      });
    }
  };
}

export type DeleteUserControls = ReturnType<typeof useDeleteUser>;
