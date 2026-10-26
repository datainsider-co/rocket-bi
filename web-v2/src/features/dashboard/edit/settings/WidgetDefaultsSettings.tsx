import { Divider, Form, InputNumber, Select, Slider } from 'antd';
import { numberAt, stringAt, withPath, withRadius } from './dashboardSettings.utils';
import { HexColorInput } from './HexColorInput';
import type { SettingsSectionProps } from './settingsSection';

const FONT_SIZES = ['10px', '12px', '13px', '14px', '16px', '18px', '20px', '24px', '28px'].map(size => ({ value: size, label: size }));
const WIDGET = ['widget_setting'];

/** v1 `WidgetSettingModal`: what every widget looks like unless it sets its own (padding, card, title, subtitle). */
export function WidgetDefaultsSettings({ draft, onChange }: SettingsSectionProps) {
  const set = (path: string[]) => (value: unknown) => onChange(withPath(draft, [...WIDGET, ...path], value));
  const at = (path: string[]) => [...WIDGET, ...path];
  const text = (key: 'primary_text' | 'secondary_text', label: string, size: string, color: string) => (
    <>
      <Form.Item label={`${label} size`} htmlFor={`setting-${key}`}>
        <Select id={`setting-${key}`} value={stringAt(draft, at([key, 'font_size']), size)} onChange={set([key, 'font_size'])} options={FONT_SIZES} />
      </Form.Item>
      <Form.Item label={`${label} color`}>
        <HexColorInput label={`${label} color`} value={stringAt(draft, at([key, 'color']), color)} onChange={set([key, 'color'])} />
      </Form.Item>
    </>
  );
  return (
    <>
      <Form.Item label="Padding">
        <InputNumber aria-label="Padding" min={0} max={60} value={numberAt(draft, at(['padding']), 15)} onChange={value => set(['padding'])(value ?? 0)} />
      </Form.Item>
      <Form.Item label="Background">
        <HexColorInput label="Widget background" value={stringAt(draft, at(['background', 'color']), '#FFFFFF')} onChange={set(['background', 'color'])} />
      </Form.Item>
      <Form.Item label="Background opacity">
        <Slider aria-label="Widget background opacity" min={0} max={100} value={numberAt(draft, at(['background', 'opacity']), 100)} onChange={set(['background', 'opacity'])} />
      </Form.Item>
      <Form.Item label="Border width">
        <InputNumber aria-label="Widget border width" min={0} max={20} value={numberAt(draft, at(['border', 'width']), 0)} onChange={value => set(['border', 'width'])(value ?? 0)} />
      </Form.Item>
      <Form.Item label="Border color">
        <HexColorInput label="Widget border color" value={stringAt(draft, at(['border', 'color']), '#f2f2f7')} onChange={set(['border', 'color'])} />
      </Form.Item>
      <Form.Item label="Corner radius">
        <InputNumber
          aria-label="Widget corner radius"
          min={0}
          max={100}
          value={numberAt(draft, at(['border', 'radius', 'top_left']), 20)}
          onChange={value => onChange(withRadius(draft, at(['border', 'radius']), value ?? 0))}
        />
      </Form.Item>
      <Divider className="my-2!" />
      {text('primary_text', 'Title', '20px', '#4f4f4f')}
      {text('secondary_text', 'Subtitle', '12px', '#5f6368')}
    </>
  );
}
