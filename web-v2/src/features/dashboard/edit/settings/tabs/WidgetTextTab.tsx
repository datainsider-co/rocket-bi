import type { ReactNode } from 'react';
import { AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons';
import { Button, Select, Space } from 'antd';
import { booleanAt, numberAt, stringAt, withPath } from '../dashboardSettings.utils';
import { ColorInput } from '../fields/ColorInput';
import { PercentInput } from '../fields/PercentInput';
import { SettingField } from '../fields/SettingField';
import { FONT_FAMILIES, FONT_SIZES, FONT_WEIGHTS } from '../settingOptions';
import type { SettingsSectionProps } from '../settingsSection';

export interface TextDefaults {
  fontSize: string;
  fontWeight: string;
  color: string;
}

interface WidgetTextTabProps extends SettingsSectionProps {
  /** `primary_text` (titles) or `secondary_text` (subtitles, tooltips). */
  textKey: 'primary_text' | 'secondary_text';
  description: string;
  /** v1 `TextStyleSetting.primaryDefault()` / `secondaryDefault()`. */
  defaults: TextDefaults;
}

const STYLES: { key: string; label: string; icon: ReactNode }[] = [
  { key: 'is_bold', label: 'Bold', icon: <BoldOutlined /> },
  { key: 'is_italic', label: 'Italic', icon: <ItalicOutlined /> },
  { key: 'is_underline', label: 'Underline', icon: <UnderlineOutlined /> }
];

const ALIGNS: { key: string; label: string; icon: ReactNode }[] = [
  { key: 'left', label: 'Align left', icon: <AlignLeftOutlined /> },
  { key: 'center', label: 'Align center', icon: <AlignCenterOutlined /> },
  { key: 'right', label: 'Align right', icon: <AlignRightOutlined /> }
];

/** v1 `WidgetTextSetting`: the font, emphasis, alignment and color of every widget's title or subtitle. */
export function WidgetTextTab({ draft, onChange, textKey, description, defaults }: WidgetTextTabProps) {
  const at = (key: string) => ['widget_setting', textKey, key];
  const set = (key: string) => (value: unknown) => onChange(withPath(draft, at(key), value));
  const select = (key: string, label: string, fallback: string, options: readonly { value: string; label: string }[]) => (
    <Select aria-label={label} className="setting-input w-full" value={stringAt(draft, at(key), fallback)} onChange={set(key)} options={[...options]} />
  );
  const toggle = (pressed: boolean, label: string, icon: ReactNode, onClick: () => void, wide = false) => (
    <Button key={label} className={`setting-toggle ${wide ? 'setting-toggle--wide' : ''}`} aria-label={label} title={label} aria-pressed={pressed} icon={icon} onClick={onClick} />
  );
  const align = stringAt(draft, at('text_align'), 'center');
  return (
    <div className="setting-tab">
      <p className="setting-tab__subtitle setting-tab__subtitle--tight">{description}</p>
      <div className="setting-row setting-row--text mb-[22px]">
        <SettingField label="Font" className="w-[246px]">
          {select('font_family', 'Font', 'Roboto', FONT_FAMILIES)}
        </SettingField>
        <SettingField label="Font Size" className="w-[111px]">
          {select('font_size', 'Font size', defaults.fontSize, FONT_SIZES)}
        </SettingField>
        <SettingField label="Font Weight" className="w-[111px]">
          {select('font_weight', 'Font weight', defaults.fontWeight, FONT_WEIGHTS)}
        </SettingField>
      </div>
      <div className="setting-row mb-[22px] gap-[22px]">
        <Space.Compact>{STYLES.map(({ key, label, icon }) => toggle(booleanAt(draft, at(key)), label, icon, () => set(key)(!booleanAt(draft, at(key)))))}</Space.Compact>
        <Space.Compact>{ALIGNS.map(({ key, label, icon }) => toggle(align === key, label, icon, () => set('text_align')(key), true))}</Space.Compact>
      </div>
      <SettingField label="Color" className="mb-[22px] w-[160px]">
        <ColorInput label="Text color" value={stringAt(draft, at('color'), defaults.color)} onChange={set('color')} />
      </SettingField>
      <SettingField label="Opacity" className="w-[162px]">
        <PercentInput label="Text opacity" value={numberAt(draft, at('color_opacity'), 100)} onChange={set('color_opacity')} />
      </SettingField>
    </div>
  );
}
