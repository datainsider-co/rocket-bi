import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import type { Directory } from '@/core/directory/Directory';
import { DirectoryAction, DirectorySection, itemPath, typeLabel } from '../../directory.utils';
import { directoryKeys } from '../../directoryQueries';
import { useDirectoryMutations } from '../../useDirectoryMutations';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

/** What a row can do: open it, share it, the settings menu, and Trash's restore and delete. */
export function useRowActions(section: DirectorySection) {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const mutations = useDirectoryMutations();
  const [renaming, setRenaming] = useState<Directory | null>(null);
  const [moving, setMoving] = useState<Directory | null>(null);
  const [sharing, setSharing] = useState<Directory | null>(null);
  const queryClient = useQueryClient();

  const run = async (task: Promise<unknown>) => {
    try {
      await task;
    } catch (error) {
      void message.error(errorMessage(error));
    }
  };

  const confirmDelete = (directory: Directory, title: string, onOk: () => Promise<void>) => {
    void modal.confirm({
      title,
      content: `Are you sure to delete ${typeLabel(directory.directoryType)} '${directory.name}'?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk
    });
  };

  const onAction = (directory: Directory, action: DirectoryAction) => {
    switch (action) {
      case DirectoryAction.Rename:
        mutations.rename.reset();
        setRenaming(directory);
        break;
      case DirectoryAction.Move:
        setMoving(directory);
        break;
      case DirectoryAction.Star:
      case DirectoryAction.Unstar:
        void run(mutations.toggleStar.mutateAsync(directory));
        break;
      case DirectoryAction.Remove:
        confirmDelete(directory, 'Move to trash', () => run(mutations.remove.mutateAsync(directory.id)));
        break;
    }
  };

  return {
    /** Items in Trash can't be opened, as in v1. */
    onOpen:
      section === DirectorySection.Trash ? undefined : (directory: Directory) => void navigate(itemPath(directory)),
    onAction,
    onRestore: (directory: Directory) => void run(mutations.restore.mutateAsync(directory.id)),
    onDeleteForever: (directory: Directory) =>
      confirmDelete(directory, 'Delete forever', () => run(mutations.deleteForever.mutateAsync(directory.id))),
    rename: {
      target: renaming,
      isSubmitting: mutations.rename.isPending,
      error: mutations.rename.error?.message,
      submit: async (name: string) => {
        if (!renaming) return;
        try {
          await mutations.rename.mutateAsync({ directory: renaming, name });
          setRenaming(null);
        } catch {
          // Shown in the dialog through `error`.
        }
      },
      cancel: () => setRenaming(null)
    },
    share: {
      target: sharing,
      open: (directory: Directory) => setSharing(directory),
      close: () => setSharing(null),
      // v1 reloaded the listing after sharing.
      onShared: () => void queryClient.invalidateQueries({ queryKey: directoryKeys.all })
    },
    move: {
      target: moving,
      submit: (toParentId: number) => {
        const id = moving?.id;
        setMoving(null);
        if (id !== undefined) void run(mutations.move.mutateAsync({ id, toParentId }));
      },
      cancel: () => setMoving(null)
    }
  };
}
