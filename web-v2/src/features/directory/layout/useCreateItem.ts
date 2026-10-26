import { useState } from 'react';
import { useNavigate } from 'react-router';
import { dashboardPath } from '@/shared/routing/idParam';
import { folderPath } from '../directory.utils';
import { useDirectoryMutations } from '../useDirectoryMutations';

export type CreateKind = 'folder' | 'dashboard';

/**
 * The `New` menu: asks for a name, creates the item under `parentId` and opens it, as v1 did. The dashboard page
 * isn't migrated yet, so a new dashboard opens on Not found for now.
 */
export function useCreateItem(parentId: number) {
  const [kind, setKind] = useState<CreateKind | null>(null);
  const { createFolder, createDashboard } = useDirectoryMutations();
  const navigate = useNavigate();
  const mutation = kind === 'dashboard' ? createDashboard : createFolder;

  const open = (next: CreateKind) => {
    createFolder.reset();
    createDashboard.reset();
    setKind(next);
  };

  const submit = async (name: string) => {
    try {
      if (kind === 'dashboard') {
        const dashboard = await createDashboard.mutateAsync({ name, parentId });
        void navigate(dashboardPath(dashboard.id, dashboard.name));
      } else {
        const folder = await createFolder.mutateAsync({ name, parentId });
        void navigate(folderPath(folder.id, folder.name));
      }
      setKind(null);
    } catch {
      // Shown in the dialog through `error`.
    }
  };

  return {
    kind,
    open,
    close: () => setKind(null),
    submit,
    isSubmitting: mutation.isPending,
    error: mutation.error?.message
  };
}
