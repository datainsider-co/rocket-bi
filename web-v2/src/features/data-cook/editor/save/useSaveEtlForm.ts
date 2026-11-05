import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { browserOffsetAt, type OffsetAt } from '@/shared/schedule/schedule.utils';
import type { EtlDraft } from '../draft/etlDraft.utils';
import { incrementalSources, saveEtlSchema, saveEtlValuesOf, savedEtlOf, type SaveEtlValues } from './saveEtl.utils';

/** The Save dialog's form on the draft; `onSubmit` gets the ETL to save. */
export function useSaveEtlForm(draft: EtlDraft, onSubmit: (etl: EtlJob) => void, now: () => number = Date.now, offsetAt: OffsetAt = browserOffsetAt) {
  const [defaultValues] = useState(() => saveEtlValuesOf(draft, now(), offsetAt));
  const form = useForm<SaveEtlValues>({ resolver: zodResolver(saveEtlSchema), defaultValues });
  const sources = useMemo(() => incrementalSources(draft.graph), [draft.graph]);
  return {
    control: form.control,
    sources,
    submit: form.handleSubmit(values => onSubmit(savedEtlOf(draft, values, now(), offsetAt)))
  };
}

export type SaveEtlFormModel = ReturnType<typeof useSaveEtlForm>;
