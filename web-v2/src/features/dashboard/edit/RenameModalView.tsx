import { useState } from 'react';
import { Input, Modal } from 'antd';

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

/** v1 `DiRenameModal`: one name, saved on Enter or OK. */
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
    <Modal open centered title={title} okText="Save" okButtonProps={{ disabled: invalid, loading: saving }} onOk={() => void submit()} onCancel={onCancel}>
      <label htmlFor="rename-input" className="mb-1 block">
        {label}
      </label>
      <Input id="rename-input" value={name} onChange={event => setName(event.target.value)} onPressEnter={() => void submit()} status={error ? 'error' : undefined} />
      {error && <div className="mt-1 text-red-500">{error}</div>}
    </Modal>
  );
}
