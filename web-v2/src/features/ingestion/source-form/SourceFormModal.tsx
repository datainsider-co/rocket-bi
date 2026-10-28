import type { DataSource } from '@/core/ingestion/DataSource';
import { initialSourceFormValues, type SourceFormTarget } from './sourceForm.utils';
import { SourceFormView } from './SourceFormView';
import { useSourceForm } from './useSourceForm';

interface SourceFormModalProps {
  target: SourceFormTarget;
  /** Called after a save; `created` tells a new source (the page goes on to its first job) from an edit. */
  onSaved: (source: DataSource, created: boolean) => void;
  onClose: () => void;
}

/** Mounted while open, so each opening starts from `target`. */
export function SourceFormModal({ target, onSaved, onClose }: SourceFormModalProps) {
  const saved = target.mode === 'edit' ? target.source : undefined;
  const { test, save } = useSourceForm(saved, onSaved);

  return (
    <SourceFormView
      initialValues={initialSourceFormValues(target)}
      isEdit={saved !== undefined}
      test={test}
      save={save}
      onCancel={onClose}
    />
  );
}
