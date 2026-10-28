import type { JobFormTarget, JobSavePlan } from './jobForm.utils';
import { JobFormView } from './JobFormView';
import { useJobForm } from './useJobForm';

interface JobFormModalProps {
  /** A new job (on a source or not) or a saved one. Edit is always one table; create can pick several. */
  target: JobFormTarget;
  onSaved: (plan: JobSavePlan) => void;
  onClose: () => void;
}

/** Mounted while open, so each opening starts from `target`. */
export function JobFormModal({ target, onSaved, onClose }: JobFormModalProps) {
  const { form, options, save, submit, layout } = useJobForm(target, onSaved);

  return (
    <JobFormView
      form={form}
      options={options}
      layout={layout}
      save={save}
      onSubmit={() => void submit()}
      onCancel={onClose}
    />
  );
}
