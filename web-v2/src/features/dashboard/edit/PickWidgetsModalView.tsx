import { useState } from 'react';
import { Checkbox, Empty, Modal } from 'antd';
import type { WidgetId } from '@/core/dashboard/Position';

interface PickWidgetsModalViewProps {
  title: string;
  actionName: string;
  emptyText: string;
  options: readonly { id: WidgetId; label: string }[];
  onSubmit: (ids: WidgetId[]) => Promise<void>;
  onCancel: () => void;
}

/** v1 `AddChartModal`: pick widgets to move into a tab, or out of it. */
export function PickWidgetsModalView({ title, actionName, emptyText, options, onSubmit, onCancel }: PickWidgetsModalViewProps) {
  const [picked, setPicked] = useState<WidgetId[]>([]);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(picked);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open centered title={title} okText={actionName} okButtonProps={{ disabled: picked.length === 0, loading: saving }} onOk={() => void submit()} onCancel={onCancel}>
      {options.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      ) : (
        <Checkbox.Group className="flex! max-h-80 flex-col gap-2 overflow-auto" value={picked} onChange={values => setPicked(values as WidgetId[])}>
          {options.map(option => (
            <Checkbox key={option.id} value={option.id}>
              {option.label}
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
    </Modal>
  );
}
