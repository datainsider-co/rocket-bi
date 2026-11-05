import type { EtlJob } from '@/core/data-cook/EtlJob';
import type { EtlDraft } from '../draft/etlDraft.utils';
import { SaveEtlModalView } from './SaveEtlModalView';
import { useSaveEtlForm } from './useSaveEtlForm';

interface SaveEtlModalProps {
  draft: EtlDraft;
  saving: boolean;
  error: string | undefined;
  onSave: (etl: EtlJob) => void;
  onCancel: () => void;
}

/** The Save dialog on the draft; mounted per opening, so it starts from the draft as it is. */
export function SaveEtlModal({ draft, saving, error, onSave, onCancel }: SaveEtlModalProps) {
  return <SaveEtlModalView form={useSaveEtlForm(draft, onSave)} saving={saving} error={error} onCancel={onCancel} />;
}
