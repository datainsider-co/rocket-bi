import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { DatabaseService, type DatabaseEntry } from '@/core/schema/DatabaseService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { warehouseKeys } from '../warehouseQueries';
import { deleteDatabaseText } from './databases.utils';

/**
 * A row's Delete: v1's confirm, then `DELETE databases/{name}`. The listing and the database tree reload once the
 * server is done; v1 dropped the database from its store before, and kept it gone when the delete failed.
 */
export function useDeleteDatabase(): (entry: DatabaseEntry) => void {
  const service = useDi(DatabaseService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();

  const { mutateAsync } = useMutation({
    mutationFn: (entry: DatabaseEntry) => service.delete(entry.name),
    onSuccess: (_, entry) => {
      queryClient.removeQueries({ queryKey: schemaKeys.database(entry.name) });
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.databases });
      void queryClient.invalidateQueries({ queryKey: schemaKeys.databases });
      void message.success(`Database ${entry.displayName} deleted`);
    },
    onError: error => void message.error(toErrorMessage(error))
  });

  return useCallback(
    (entry: DatabaseEntry) => {
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
