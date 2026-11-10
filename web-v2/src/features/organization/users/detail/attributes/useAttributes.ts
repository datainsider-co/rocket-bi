import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { UserAdminService } from '@/core/admin/UserAdminService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { userKeys } from '../../userQueries';
import { deleteAttribute, saveAttribute, type AttributeForm, type AttributeRow, type AttributeUpdate } from './attributes.utils';

/** The attribute being added (`null` key) or edited, if the modal is open. */
export type AttributeEditing = { readonly row: AttributeRow | null } | null;

/** Add, edit and delete a user's attributes (v1 `ContactDetailsForm` ATTRIBUTES, `AddNewFieldModal`). */
export function useAttributes(username: string) {
  const service = useDi(UserAdminService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const [editing, setEditing] = useState<AttributeEditing>(null);

  const update = useMutation({
    mutationFn: ({ properties, deletedKeys }: AttributeUpdate) => service.updateProperties(username, properties, deletedKeys),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.detail(username) })
  });

  return {
    editing,
    add: () => {
      update.reset();
      setEditing({ row: null });
    },
    edit: (row: AttributeRow) => {
      update.reset();
      setEditing({ row });
    },
    close: () => setEditing(null),
    save: {
      run: (form: AttributeForm) =>
        update.mutate(saveAttribute(form, editing?.row?.key), { onSuccess: () => setEditing(null) }),
      isPending: update.isPending,
      errorMessage: editing && update.isError ? toErrorMessage(update.error) : undefined
    },
    remove: (row: AttributeRow) =>
      void modal.confirm({
        title: 'Delete Attribute',
        content: `Delete the attribute "${row.key}"?`,
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: () =>
          update.mutateAsync(deleteAttribute(row.key)).catch((error: unknown) => void message.error(toErrorMessage(error)))
      })
  };
}

export type AttributesControls = ReturnType<typeof useAttributes>;
