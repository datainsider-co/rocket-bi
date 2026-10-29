import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { DatabaseService, type DatabaseEntry } from '@/core/schema/DatabaseService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { warehouseKeys } from '../warehouseQueries';
import { deleteDatabaseText } from './databases.utils';

/** What a delete needs of a database: the listing's rows and the Schema page both have it. */
export type DeletableDatabase = Pick<DatabaseEntry, 'name' | 'displayName'>;

/**
 * A row's Delete: v1's confirm, then `DELETE databases/{name}`. The listing and the database tree reload once the
 * server is done; v1 dropped the database from its store before, and kept it gone when the delete failed.
 */
export function useDeleteDatabase(onDeleted?: (entry: DeletableDatabase) => void): (entry: DeletableDatabase) => void {
  const service = useDi(DatabaseService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();

  const { mutateAsync } = useMutation({
    mutationFn: (entry: DeletableDatabase) => service.delete(entry.name),
    onSuccess: (_, entry) => {
      // Stale, not refetched: the tree and the Schema page may still be showing it.
      void queryClient.invalidateQueries({ queryKey: schemaKeys.database(entry.name), refetchType: 'none' });
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.databases });
      void queryClient.invalidateQueries({ queryKey: schemaKeys.databases });
      void message.success(`Database ${entry.displayName} deleted`);
      onDeleted?.(entry);
    },
    onError: error => void message.error(toErrorMessage(error))
  });

  return useCallback(
    (entry: DeletableDatabase) => {
      void modal.confirm({
        title: 'Delete database',
        content: deleteDatabaseText(entry),
        okText: 'Delete',
        okButtonProps: { danger: true },
        // The error shows as a toast; the confirm closes either way.
        onOk: () => mutateAsync(entry).catch(() => undefined)
      });
    },
    [modal, mutateAsync]
  );
}
