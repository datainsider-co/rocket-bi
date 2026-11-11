import { useState } from 'react';
import { Input } from 'antd';
import { CustomDialog } from '../dialogs/CustomDialog';

interface RenameModalViewProps {
  title: string;
  label: string;
  initial: string;
  /** Saves; the modal closes once it resolves, and stays open with its error otherwise. */
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  /** Whether an empty name is refused (a dashboard needs one, a chart title may be blank). */
  required?: boolean;
}

/** v1 `DiRenameModal`: one name in a grey field under its label, saved on Enter or Rename; errors show under the field. */
export function RenameModalView({ title, label, initial, onSubmit, onCancel, required = false }: RenameModalViewProps) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const invalid = required && name.trim() === '';

  const submit = async () => {
    if (invalid) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSubmit(name.trim());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Rename failure, try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomDialog title={title} okText="Rename" okDisabled={invalid} saving={saving} onOk={() => void submit()} onCancel={onCancel}>
      <label htmlFor="rename-input" className="custom-dialog__label">
        {label}
      </label>
      <Input id="rename-input" autoComplete="off" placeholder="Input your title" value={name} onChange={event => setName(event.target.value)} onPressEnter={() => void submit()} />
      {invalid && <div className="custom-dialog__error">Field is required.</div>}
      {error && (
        <div className="custom-dialog__error" role="alert" title={error}>
          {error}
        </div>
      )}
    </CustomDialog>
  );
}
