import { Divider, Form, Input, InputNumber, Select, Slider, Space } from 'antd';
import { FitMode, SizeUnit } from '@/core/dashboard/DashboardSetting';
import { numberAt, stringAt, withPath, withRadius } from './dashboardSettings.utils';
import { HexColorInput } from './HexColorInput';
import type { SettingsSectionProps } from './settingsSection';

const UNITS = [SizeUnit.Px, SizeUnit.Percent, SizeUnit.Auto].map(unit => ({ value: unit, label: unit }));
const FIT_MODES = Object.values(FitMode).map(mode => ({ value: mode, label: mode }));

/** v1 `EditDashboardModal`: the dashboard's size, background and border. */
export function LayoutSettings({ draft, onChange }: SettingsSectionProps) {
  const set = (path: string[]) => (value: unknown) => onChange(withPath(draft, path, value));
  const size = (dimension: 'width' | 'height') => (
    <Space.Compact>
      <InputNumber aria-label={dimension} min={0} value={numberAt(draft, ['size', dimension], 0)} onChange={value => set(['size', dimension])(value ?? 0)} />
      <Select aria-label={`${dimension} unit`} className="w-20!" value={stringAt(draft, ['size', `${dimension}_unit`], SizeUnit.Auto)} onChange={set(['size', `${dimension}_unit`])} options={UNITS} />
    </Space.Compact>
  );
  return (
    <>
      <Form.Item label="Width">{size('width')}</Form.Item>
      <Form.Item label="Height">{size('height')}</Form.Item>
      <Divider className="my-2!" />
      <Form.Item label="Background">
        <HexColorInput label="Background color" value={stringAt(draft, ['background', 'color'], '#fafafb')} onChange={set(['background', 'color'])} />
      </Form.Item>
      <Form.Item label="Background opacity">
        <Slider aria-label="Background opacity" min={0} max={100} value={numberAt(draft, ['background', 'opacity'], 100)} onChange={set(['background', 'opacity'])} />
      </Form.Item>
      <Form.Item label="Image URL" htmlFor="setting-image">
        <Input id="setting-image" placeholder="https://..." value={stringAt(draft, ['background_image', 'path'], '')} onChange={event => set(['background_image', 'path'])(event.target.value)} />
      </Form.Item>
      <Form.Item label="Image fit" htmlFor="setting-fit">
        <Select id="setting-fit" value={stringAt(draft, ['background_image', 'fit_mode'], FitMode.Repeat)} onChange={set(['background_image', 'fit_mode'])} options={FIT_MODES} />
      </Form.Item>
      <Divider className="my-2!" />
      <Form.Item label="Border width">
        <InputNumber aria-label="Border width" min={0} max={20} value={numberAt(draft, ['border', 'width'], 1)} onChange={value => set(['border', 'width'])(value ?? 0)} />
      </Form.Item>
      <Form.Item label="Border color">
        <HexColorInput label="Border color" value={stringAt(draft, ['border', 'color'], '#f2f2f7')} onChange={set(['border', 'color'])} />
      </Form.Item>
      <Form.Item label="Corner radius">
        <InputNumber aria-label="Corner radius" min={0} max={100} value={numberAt(draft, ['border', 'radius', 'top_left'], 20)} onChange={value => onChange(withRadius(draft, ['border', 'radius'], value ?? 0))} />
      </Form.Item>
    </>
  );
}
