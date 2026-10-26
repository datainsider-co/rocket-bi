import { useState } from 'react';
import { Form, Modal, Tabs } from 'antd';
import type { JsonObject } from '@/core/json/json';
import { GeneralSettings } from './GeneralSettings';
import { LayoutSettings } from './LayoutSettings';
import { WidgetDefaultsSettings } from './WidgetDefaultsSettings';

interface DashboardSettingsModalViewProps {
  /** `settingDraft` of the dashboard. */
  initial: JsonObject;
  onSubmit: (setting: JsonObject) => Promise<void>;
  onCancel: () => void;
}

/** v1's Settings, Edit Dashboard, Edit Widgets and Themes dialogs in one, saved together. */
export function DashboardSettingsModalView({ initial, onSubmit, onCancel }: DashboardSettingsModalViewProps) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(draft);
    } finally {
      setSaving(false);
    }
  };
  const section = { draft, onChange: setDraft };
  return (
    <Modal open centered width={640} title="Dashboard Settings" okText="Save" okButtonProps={{ loading: saving }} onOk={() => void submit()} onCancel={onCancel}>
      <Form layout="horizontal" labelCol={{ span: 8 }} colon={false} className="max-h-[60vh] overflow-auto pr-2">
        <Tabs
          items={[
            { key: 'general', label: 'General', children: <GeneralSettings {...section} /> },
            { key: 'layout', label: 'Dashboard', children: <LayoutSettings {...section} /> },
            { key: 'widgets', label: 'Widgets', children: <WidgetDefaultsSettings {...section} /> }
          ]}
        />
      </Form>
    </Modal>
  );
}
