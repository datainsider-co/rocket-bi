import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { DataSource, SourceId } from '@/core/ingestion/DataSource';
import { DataSourceService } from '@/core/ingestion/DataSourceService';
import { toErrorMessage } from '../ingestion.utils';
import { ingestionKeys } from '../ingestionQueries';
import { deleteSourcesText } from './sources.utils';

/**
 * Delete one source (row button) or the checked ones (header), after v1's confirm. Deleted rows leave the selection on
 * their own: it only counts ids on the page.
 */
export function useSourceActions() {
  const service = useDi(DataSourceService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();

  const { mutateAsync } = useMutation({
    mutationFn: async (ids: readonly SourceId[]) => {
      const [only] = ids;
      if (ids.length === 1 && only !== undefined) await service.delete(only);
      else await service.deleteMany(ids);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ingestionKeys.all });
    },
    onError: error => void message.error(toErrorMessage(error))
  });

  const confirmDelete = useCallback(
    (sources: readonly DataSource[]) => {
      if (sources.length === 0) return;
      void modal.confirm({
        title: 'Delete',
        content: deleteSourcesText(sources),
        okText: 'Delete',
        okButtonProps: { danger: true },
        // The error shows as a toast; the confirm closes either way.
        onOk: () => mutateAsync(sources.map(source => source.id)).catch(() => undefined)
      });
    },
    [modal, mutateAsync]
  );

  return { confirmDelete };
}
