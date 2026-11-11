import { useState } from 'react';
import { Button, ColorPicker, Input, Modal, Select, Tabs } from 'antd';
import type { WidgetSetting } from '@/core/dashboard/DashboardSetting';
import type { TextContent, TextStyle } from '@/core/dashboard/widgetJson';
import type { JsonObject } from '@/core/json/json';
import { getDashboardTheme } from '../theme/dashboardThemes';
import { TextWidgetView } from '../widgets/text/TextWidgetView';
import { WidgetContainer } from '../widgets/WidgetContainer';
import { PercentInput } from './settings/fields/PercentInput';
import { pickerColor, reviewedTextWidget, TEXT_FONT_FAMILIES, TEXT_FONT_SIZES } from './textEditor.utils';
import './settings/settings.css';
import './TextEditor.css';

interface TextEditorModalViewProps {
  title: string;
  initial: TextContent;
  /** The widget being edited, empty for a new one: what Review renders the draft on. */
  json: JsonObject;
  /** The dashboard's widget defaults and theme, which Review shows the card with. */
  defaults: WidgetSetting;
  themeName: string;
  onSubmit: (content: TextContent) => Promise<void>;
  onCancel: () => void;
}

type Emphasis = 'isBold' | 'isItalic' | 'isUnderline';

const EMPHASES: readonly { key: Emphasis; label: string; icon: string }[] = [
  { key: 'isBold', label: 'Bold', icon: 'text-bold' },
  { key: 'isItalic', label: 'Italic', icon: 'text-italic' },
  { key: 'isUnderline', label: 'Underline', icon: 'text-underline' }
];

const ALIGNS: readonly { value: string; label: string; icon: string }[] = [
  { value: 'left', label: 'Align left', icon: 'align-text-left' },
  { value: 'center', label: 'Align center', icon: 'align-text-center' },
  { value: 'right', label: 'Align right', icon: 'align-text-right' }
];

const MODES = [
  { key: 'text', label: 'Text', icon: <i className="di-icon-text" aria-hidden /> },
  { key: 'html', label: 'HTML', icon: <i className="di-icon-code" aria-hidden /> }
];

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

/** v1 `ColorPickerV2`: a fill icon and the color, which opens a picker. A theme variable shows its current color. */
function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <ColorPicker value={pickerColor(value)} onChangeComplete={color => onChange(color.toHexString())}>
      <button type="button" className="setting-color-input text-editor__color" aria-label={label} title={label}>
        <i className="di-icon-color" aria-hidden />
        <span className="setting-color-input__swatch" style={{ background: value }} />
      </button>
    </ColorPicker>
  );
}

/**
 * v1 `EditTextModal` + `PreviewText`: the text or HTML on the left, the widget it makes on the right, and under both
 * the text's font, emphasis, alignment, color and opacity, then the card's background.
 */
export function TextEditorModalView({ title, initial, json, defaults, themeName, onSubmit, onCancel }: TextEditorModalViewProps) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const setStyle = (style: Partial<TextStyle>) => setDraft(current => ({ ...current, style: { ...current.style, ...style } }));
  const { style } = draft;
  const empty = draft.content.trim() === '';
  const reviewed = reviewedTextWidget(json, draft);

  const submit = async () => {
    if (empty) return;
    setSaving(true);
    try {
      await onSubmit(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      centered
      width={1071}
      className="text-editor"
      closable={false}
      keyboard={!saving}
      mask={{ closable: !saving }}
      onCancel={onCancel}
      title={
        <span className="text-editor__title">
          <img src="/icons/add-text.svg" width={24} height={25} alt="" />
          {title}
        </span>
      }
      footer={
        <>
          <Button disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" disabled={empty} loading={saving} onClick={() => void submit()}>
            Save
          </Button>
        </>
      }
    >
      <div className="text-editor__panels">
        <div className="text-editor__panel">
          <Tabs
            className="text-editor__modes"
            activeKey={draft.isHtmlRender ? 'html' : 'text'}
            onChange={key => setDraft(current => ({ ...current, isHtmlRender: key === 'html' }))}
            items={MODES}
          />
          <p className="text-editor__description">Enter the content to add below, and you can manipulate the text color, background, and size</p>
          <Input.TextArea
            aria-label={draft.isHtmlRender ? 'HTML' : 'Text'}
            className="text-editor__input"
            spellCheck={false}
            placeholder={draft.isHtmlRender ? 'Input code...' : 'Input text...'}
            value={draft.content}
            onChange={event => setDraft(current => ({ ...current, content: event.target.value }))}
          />
        </div>
        <div className="text-editor__panel">
          <div className="text-editor__review-title">Review</div>
          <p className="text-editor__description">
            View the result here. You can edit the values of these properties to change the text color, background, and font size according to your preferences.
          </p>
          <div className="text-editor__review dashboard-theme" data-dashboard-theme={getDashboardTheme(themeName).cssName}>
            <div className="text-editor__card">
              <WidgetContainer widget={reviewed} defaults={defaults}>
                <TextWidgetView widget={reviewed} />
              </WidgetContainer>
            </div>
          </div>
        </div>
      </div>
      <div className="text-editor__config">
        <div className="text-editor__group">
          <div className="text-editor__group-title">Text</div>
          <div className="text-editor__controls">
            <Select aria-label="Font family" className="setting-input text-editor__family" popupMatchSelectWidth={false} value={style.fontFamily} onChange={fontFamily => setStyle({ fontFamily })} options={[...TEXT_FONT_FAMILIES]} />
            <Select aria-label="Font size" className="setting-input text-editor__size" value={style.fontSize} onChange={fontSize => setStyle({ fontSize })} options={[...TEXT_FONT_SIZES]} />
            <fieldset className="text-editor__buttons" aria-label="Emphasis">
              {EMPHASES.map(({ key, label, icon }) => (
                <button key={key} type="button" aria-label={label} title={label} aria-pressed={style[key]} onClick={() => setStyle({ [key]: !style[key] })}>
                  <img src={`/icons/${icon}.svg`} alt="" />
                </button>
              ))}
            </fieldset>
            <fieldset className="text-editor__buttons text-editor__buttons--wide" aria-label="Alignment">
              {ALIGNS.map(({ value, label, icon }) => (
                <button key={value} type="button" aria-label={label} title={label} aria-pressed={style.textAlign === value} onClick={() => setStyle({ textAlign: value })}>
                  <img src={`/icons/${icon}.svg`} alt="" />
                </button>
              ))}
            </fieldset>
            <ColorField label="Text color" value={style.fontColor} onChange={fontColor => setStyle({ fontColor })} />
            <div className="text-editor__percent">
              <PercentInput label="Text opacity" value={style.opacity} onChange={opacity => setStyle({ opacity })} />
            </div>
          </div>
        </div>
        <div className="text-editor__group">
          <div className="text-editor__group-title text-editor__group-title--medium">Background</div>
          <div className="text-editor__controls">
            <ColorField label="Background color" value={style.background} onChange={background => setStyle({ background })} />
            <div className="text-editor__percent">
              <PercentInput label="Background opacity" value={style.backgroundOpacity} onChange={backgroundOpacity => setStyle({ backgroundOpacity })} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
