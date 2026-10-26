import { useState, type ReactNode } from 'react';
import { BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Segmented, Select, Space, Switch } from 'antd';
import type { TextContent, TextStyle } from '@/core/dashboard/widgetJson';
import { textPreviewStyle } from './textEditor.utils';

const FONT_SIZES = ['10px', '12px', '13px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px'];

interface TextEditorModalViewProps {
  title: string;
  initial: TextContent;
  onSubmit: (content: TextContent) => Promise<void>;
  onCancel: () => void;
}

/** v1 `EditTextModal` + `PreviewText`: the text, whether it is HTML, its font size, color, alignment and emphasis. */
export function TextEditorModalView({ title, initial, onSubmit, onCancel }: TextEditorModalViewProps) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const setStyle = (style: Partial<TextStyle>) => setDraft(current => ({ ...current, style: { ...current.style, ...style } }));
  const { style } = draft;
  const empty = draft.content.trim() === '';

  const submit = async () => {
    if (empty) return;
    setSaving(true);
    try {
      await onSubmit(draft);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: 'isBold' | 'isItalic' | 'isUnderline', icon: ReactNode, label: string) => (
    <Button aria-label={label} aria-pressed={style[key]} type={style[key] ? 'primary' : 'default'} icon={icon} onClick={() => setStyle({ [key]: !style[key] })} />
  );

  return (
    <Modal open centered width={640} title={title} okText="Save" okButtonProps={{ disabled: empty, loading: saving }} onOk={() => void submit()} onCancel={onCancel}>
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Font size" className="w-24" value={style.fontSize} onChange={fontSize => setStyle({ fontSize })} options={FONT_SIZES.map(size => ({ value: size, label: size }))} />
        <Input aria-label="Text color" type="color" className="w-12! p-1!" value={style.fontColor.startsWith('#') ? style.fontColor : '#4f4f4f'} onChange={event => setStyle({ fontColor: event.target.value })} />
        <Space.Compact>
          {toggle('isBold', <BoldOutlined />, 'Bold')}
          {toggle('isItalic', <ItalicOutlined />, 'Italic')}
          {toggle('isUnderline', <UnderlineOutlined />, 'Underline')}
        </Space.Compact>
        <Segmented
          aria-label="Alignment"
          value={style.textAlign}
          onChange={textAlign => setStyle({ textAlign: textAlign as TextStyle['textAlign'] })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' }
          ]}
        />
        <span className="ml-auto flex items-center gap-2">
          HTML
          <Switch size="small" aria-label="Render as HTML" checked={draft.isHtmlRender} onChange={isHtmlRender => setDraft(current => ({ ...current, isHtmlRender }))} />
        </span>
      </div>
      <Input.TextArea
        aria-label="Text"
        className="mt-3"
        autoSize={{ minRows: 4, maxRows: 12 }}
        placeholder={draft.isHtmlRender ? '<b>Bold</b> text' : 'Type your text'}
        value={draft.content}
        onChange={event => setDraft(current => ({ ...current, content: event.target.value }))}
        style={textPreviewStyle(style)}
      />
    </Modal>
  );
}
