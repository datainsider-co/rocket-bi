import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { etlsChanged } from '../dataCookQueries';
import { deleteForeverText, forceRunMessage, restoreEtlText, trashEtlText } from './etlListing.utils';

interface ConfirmText {
  readonly title: string;
  readonly content: string;
  readonly okText: string;
  readonly danger: boolean;
}

/**
 * v1 `ListEtlJob` actions: force run at a time, cancel a run, move to the trash, restore and delete forever, the last
 * three after a confirm. Each reloads Data Cook when done; failures show as toasts. `now` is when the toast is written.
 */
export function useEtlActions(now: () => number = Date.now) {
  const service = useDi(EtlService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const options = {
    onSettled: () => void etlsChanged(queryClient),
    onError: (error: Error) => void message.error(toErrorMessage(error))
  };

  const forceRun = useMutation({
    mutationFn: ({ etl, atTime }: { etl: EtlJob; atTime: number }) => service.forceRun(etl.id, atTime),
    onSuccess: (_, { atTime }) => void message.success(forceRunMessage(atTime, now())),
    ...options
  });

  const cancel = useMutation({
    mutationFn: (etl: EtlJob) => service.cancel(etl.id),
    onSuccess: () => void message.success('ETL cancelled'),
    ...options
  });

  const trash = useMutation({ mutationFn: (etl: EtlJob) => service.moveToTrash(etl.id), ...options });
  const restore = useMutation({
    mutationFn: (etl: EtlJob) => service.restore(etl.id),
    onSuccess: () => void message.success('ETL restored'),
    ...options
  });
  const deleteForever = useMutation({ mutationFn: (etl: EtlJob) => service.deleteForever(etl.id), ...options });

  const { mutateAsync: trashEtl } = trash;
  const { mutateAsync: restoreEtl } = restore;
  const { mutateAsync: deleteEtlForever } = deleteForever;

  /** The error shows as a toast; the confirm closes either way. */
  const confirm = useCallback(
    ({ title, content, okText, danger }: ConfirmText, run: () => Promise<unknown>) =>
      void modal.confirm({ title, content, okText, okButtonProps: { danger }, onOk: () => run().catch(() => undefined) }),
    [modal]
  );

  return {
    /** Resolves once the run is scheduled; rejects (after the toast) when it couldn't be. */
    forceRun: forceRun.mutateAsync,
    cancel: cancel.mutate,
    confirmTrash: useCallback(
      (etl: EtlJob) => confirm({ title: 'Delete ETL', content: trashEtlText(etl), okText: 'Delete', danger: true }, () => trashEtl(etl)),
      [confirm, trashEtl]
    ),
    confirmRestore: useCallback(
      (etl: EtlJob) => confirm({ title: 'Restore ETL', content: restoreEtlText(etl), okText: 'Restore', danger: false }, () => restoreEtl(etl)),
      [confirm, restoreEtl]
    ),
    confirmDeleteForever: useCallback(
      (etl: EtlJob) =>
        confirm(
          { title: 'Delete ETL forever', content: deleteForeverText(etl), okText: 'Delete', danger: true },
          () => deleteEtlForever(etl)
        ),
      [confirm, deleteEtlForever]
    ),
    isForceRunning: forceRun.isPending,
    /** A cancel is on its way; the row buttons wait for it. */
    isBusy: cancel.isPending
  };
}
