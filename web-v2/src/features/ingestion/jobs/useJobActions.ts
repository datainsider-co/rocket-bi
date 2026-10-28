import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { Job, JobId } from '@/core/ingestion/Job';
import { JobService } from '@/core/ingestion/JobService';
import { toErrorMessage } from '../ingestion.utils';
import { ingestionKeys } from '../ingestionQueries';
import { deleteJobsText, forceSyncSummary } from './jobs.utils';

/**
 * v1 `JobScreen` actions: force sync now (one or the checked ones), cancel a running job, delete after a confirm.
 * Each reloads the listings when done; failures show as toasts. `now` is when a forced run starts.
 */
export function useJobActions(now: () => number = Date.now) {
  const service = useDi(JobService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const options = {
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ingestionKeys.all }),
    onError: (error: Error) => void message.error(toErrorMessage(error))
  };

  const sync = useMutation({
    mutationFn: async (ids: readonly JobId[]) => {
      const [only] = ids;
      if (ids.length === 1 && only !== undefined) {
        await service.syncNow(only, now());
        return { [only]: true };
      }
      return service.syncManyNow(ids, now());
    },
    onSuccess: results => {
      const { ok, text } = forceSyncSummary(results);
      void (ok ? message.success(text) : message.warning(text));
    },
    ...options
  });

  const cancel = useMutation({
    mutationFn: (id: JobId) => service.cancel(id),
    onSuccess: cancelled => void (cancelled ? message.success('Job cancelled') : message.warning('The job is not running')),
    ...options
  });

  const remove = useMutation({
    mutationFn: async (ids: readonly JobId[]) => {
      const [only] = ids;
      if (ids.length === 1 && only !== undefined) await service.delete(only);
      else await service.deleteMany(ids);
    },
    ...options
  });

  const { mutate: forceSync } = sync;
  const { mutate: cancelJob } = cancel;
  const { mutateAsync: deleteJobs } = remove;

  const confirmDelete = useCallback(
    (jobs: readonly Job[]) => {
      if (jobs.length === 0) return;
      void modal.confirm({
        title: 'Delete',
        content: deleteJobsText(jobs),
        okText: 'Delete',
        okButtonProps: { danger: true },
        // The error shows as a toast; the confirm closes either way.
        onOk: () => deleteJobs(jobs.map(job => job.id)).catch(() => undefined)
      });
    },
    [modal, deleteJobs]
  );

  return {
    forceSync: useCallback((jobs: readonly Job[]) => forceSync(jobs.map(job => job.id)), [forceSync]),
    cancel: useCallback((job: Job) => cancelJob(job.id), [cancelJob]),
    confirmDelete,
    /** A sync or cancel is on its way; the row buttons wait for it. */
    isBusy: sync.isPending || cancel.isPending
  };
}
