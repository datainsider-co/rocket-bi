import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { JdbcJobClassName } from '@/core/ingestion/Job';
import { JobService } from '@/core/ingestion/JobService';
import { browserOffsetAt, type OffsetAt } from '@/shared/schedule/schedule.utils';
import { toErrorMessage } from '../ingestion.utils';
import { ingestionKeys } from '../ingestionQueries';
import { planJobSave, type JobFormTarget, type JobFormValues, type JobSavePlan } from './jobForm.utils';

interface SaveInput {
  readonly values: JobFormValues;
  readonly className: JdbcJobClassName;
}

/**
 * Saves the job form the way `planJobSave` says, then refreshes the ingestion listings and calls `onSaved` with the
 * plan that ran. The clock and time zone are injected for tests.
 */
export function useSaveJob(
  target: JobFormTarget,
  onSaved: (plan: JobSavePlan) => void,
  now: () => number = Date.now,
  offsetAt: OffsetAt = browserOffsetAt
) {
  const service = useDi(JobService);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ values, className }: SaveInput): Promise<JobSavePlan> => {
      const plan = planJobSave(values, { target, className, now: now(), offsetAt });
      switch (plan.kind) {
        case 'create':
          await service.create(plan.job);
          break;
        case 'createForTables':
          await service.createForTables(plan.baseJob, plan.tableNames);
          break;
        case 'update':
          await service.update(plan.job);
          break;
      }
      return plan;
    },
    onSuccess: plan => {
      void queryClient.invalidateQueries({ queryKey: ingestionKeys.all });
      onSaved(plan);
    }
  });

  return {
    run: mutation.mutate,
    isPending: mutation.isPending,
    errorMessage: mutation.isError ? toErrorMessage(mutation.error) : undefined
  };
}
