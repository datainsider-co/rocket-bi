import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { JobClassName } from '@/core/ingestion/Job';
import { browserOffsetAt } from '@/shared/schedule/schedule.utils';
import {
  initialJobFormValues,
  jobClassNameFor,
  jobFormSchema,
  type JobFormTarget,
  type JobFormValues,
  type JobSavePlan
} from './jobForm.utils';
import { useJobFormOptions } from './useJobFormOptions';
import { useSaveJob } from './useSaveJob';

/** The job form: its react-hook-form state, the suggestions it shows and its save. `now` is injected for tests. */
export function useJobForm(target: JobFormTarget, onSaved: (plan: JobSavePlan) => void, now: () => number = Date.now) {
  const [defaultValues] = useState(() => initialJobFormValues(target, now(), browserOffsetAt));
  const form = useForm<JobFormValues>({ resolver: zodResolver(jobFormSchema), defaultValues });
  const options = useJobFormOptions(form.control, target.mode === 'create' ? target.source : undefined);
  const save = useSaveJob(target, onSaved, now);

  const submit = form.handleSubmit(values => {
    const source = options.sources.items.find(item => item.id === values.sourceId);
    save.run({ values, className: source ? jobClassNameFor(source) : JobClassName.Jdbc });
  });

  return {
    form,
    options,
    save: { isPending: save.isPending, errorMessage: save.errorMessage },
    submit,
    layout: {
      isEdit: target.mode === 'edit',
      lockSource: target.mode === 'edit' || target.lockSource,
      allowMultiTable: target.mode === 'create'
    }
  };
}
