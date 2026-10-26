import { useState } from 'react';
import { Form, Input, Modal, Segmented, Select } from 'antd';
import type { TabHeaderStyle } from '../widgets/tab/tabWidget.utils';
import type { ApplyButtonStyle } from './tabEdit.utils';
import { ThemeColorInput } from './ThemeColorInput';

const FONT_SIZES = ['12px', '13px', '14px', '16px', '18px', '20px', '24px'];

interface TabStyleModalViewProps {
  title: string;
  header: TabHeaderStyle;
  /** Given for a filter panel, which has an Apply button. */
  apply?: ApplyButtonStyle;
  onSubmit: (header: TabHeaderStyle, apply?: ApplyButtonStyle) => Promise<void>;
  onCancel: () => void;
}

/** v1 `TabSettingModal` (`TabWidgetSetting`, `FilterPanelSetting`): the header and, for a filter panel, the Apply button. */
export function TabStyleModalView({ title, header: initialHeader, apply: initialApply, onSubmit, onCancel }: TabStyleModalViewProps) {
  const [header, setHeader] = useState(initialHeader);
  const [apply, setApply] = useState(initialApply);
  const [saving, setSaving] = useState(false);
  const setHeaderKey = <K extends keyof TabHeaderStyle>(key: K, value: TabHeaderStyle[K]) => setHeader(current => ({ ...current, [key]: value }));

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(header, apply);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open centered title={title} okText="Save" okButtonProps={{ loading: saving }} onOk={() => void submit()} onCancel={onCancel}>
      <Form layout="horizontal" labelCol={{ span: 8 }} colon={false}>
        {!apply && (
          <Form.Item label="Tab position">
            <Segmented
              value={header.position}
              onChange={value => setHeaderKey('position', value as TabHeaderStyle['position'])}
              options={[
                { value: 'horizontal', label: 'Top' },
                { value: 'vertical', label: 'Left' }
              ]}
            />
          </Form.Item>
        )}
        <Form.Item label="Font size">
          <Select aria-label="Font size" className="w-28!" value={header.fontSize} onChange={value => setHeaderKey('fontSize', value)} options={FONT_SIZES.map(size => ({ value: size, label: size }))} />
        </Form.Item>
        <Form.Item label="Text color">
          <ThemeColorInput label="Text color" value={header.color} themeValue="var(--text-color)" onChange={value => setHeaderKey('color', value)} />
        </Form.Item>
        {!apply && (
          <>
            <Form.Item label="Active tab">
              <ThemeColorInput label="Active tab" value={header.activeBackground} themeValue="var(--tab-widget-background-active)" onChange={value => setHeaderKey('activeBackground', value)} />
            </Form.Item>
            <Form.Item label="Other tabs">
              <ThemeColorInput label="Other tabs" value={header.inactiveBackground} themeValue="var(--tab-widget-background-deactive)" onChange={value => setHeaderKey('inactiveBackground', value)} />
            </Form.Item>
          </>
        )}
        {apply && (
          <>
            <Form.Item label="Apply title" htmlFor="apply-title">
              <Input id="apply-title" value={apply.title} onChange={event => setApply({ ...apply, title: event.target.value })} />
            </Form.Item>
            <Form.Item label="Apply text">
              <ThemeColorInput label="Apply text" value={apply.color} themeValue="var(--accent-text-color)" onChange={color => setApply({ ...apply, color })} />
            </Form.Item>
            <Form.Item label="Apply background">
              <ThemeColorInput label="Apply background" value={apply.background} themeValue="var(--accent)" onChange={background => setApply({ ...apply, background })} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
