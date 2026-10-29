import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { SchemaEditService, type TableRef } from '@/core/schema/SchemaEditService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { warehouseKeys } from '../warehouseQueries';

export type DeletableTable = TableRef & { readonly displayName: string };

/**
 * Delete Table, from the table's Action menu, the database view and the tree: v1's confirm, then
 * `DELETE databases/{db}/tables/{tbl}`, then the database reloads.
 */
export function useDeleteTable(onDeleted?: (table: DeletableTable) => void): (table: DeletableTable) => void {
  const service = useDi(SchemaEditService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();

  const { mutateAsync } = useMutation({
    mutationFn: (table: DeletableTable) => service.dropTable(table),
    onSuccess: (_, table) => {
      // Stale, not refetched: the open table view would ask for a table that is gone.
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.table(table), refetchType: 'none' });
      void queryClient.invalidateQueries({ queryKey: schemaKeys.database(table.dbName) });
      void message.success(`Table ${table.displayName} deleted`);
      onDeleted?.(table);
    },
    onError: error => void message.error(toErrorMessage(error))
  });

  return useCallback(
    (table: DeletableTable) => {
      void modal.confirm({
        title: 'Delete table',
        content: `Are you sure to permanently delete table '${table.displayName}'?`,
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: () => mutateAsync(table).catch(() => undefined)
      });
    },
    [modal, mutateAsync]
  );
}
