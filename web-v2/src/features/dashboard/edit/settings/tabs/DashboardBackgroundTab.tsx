import { Input, Select, Slider } from 'antd';
import { FitMode } from '@/core/dashboard/DashboardSetting';
import { numberAt, stringAt, withPath } from '../dashboardSettings.utils';
import { SettingField } from '../fields/SettingField';
import { FIT_MODES } from '../settingOptions';
import type { SettingsSectionProps } from '../settingsSection';

const IMAGE = ['background_image'];

const FILTERS = [
  { key: 'brightness', label: 'Brightness', fallback: 100 },
  { key: 'contrast', label: 'Contrast', fallback: 100 },
  { key: 'grayscale', label: 'Gray-scale', fallback: 0 },
  { key: 'opacity', label: 'Opacity', fallback: 100 }
];

/**
 * v1 `DashboardBackgroundSetting`: the image behind the dashboard, how it fits and its filters. The image is given by
 * URL: the open source server has no upload (v1's Upload Image).
 */
export function DashboardBackgroundTab({ draft, onChange }: SettingsSectionProps) {
  const set = (key: string) => (value: unknown) => onChange(withPath(draft, [...IMAGE, key], value));
  return (
    <div className="setting-tab">
      <h6 className="setting-tab__title">Background Dashboard</h6>
      <p className="setting-tab__subtitle">Select an image and adjust the parameters accordingly.</p>
      <SettingField label="Image URL" className="mb-4 w-[369px]">
        <Input
          aria-label="Image URL"
          className="setting-input"
          allowClear
          placeholder="https://..."
          prefix={<i className="di-icon-image" aria-hidden />}
          value={stringAt(draft, [...IMAGE, 'path'], '')}
          onChange={event => set('path')(event.target.value)}
        />
      </SettingField>
      <SettingField label="Fit Mode" className="mb-2 w-[246px]">
        <Select
          aria-label="Fit mode"
          className="setting-input w-full"
          value={stringAt(draft, [...IMAGE, 'fit_mode'], FitMode.Repeat)}
          onChange={set('fit_mode')}
          options={[...FIT_MODES]}
        />
      </SettingField>
      {FILTERS.map(({ key, label, fallback }) => (
        <div key={key} className="setting-slider">
          <div className="setting-field__label mb-0!">{label}</div>
          <Slider aria-label={label} min={0} max={100} value={numberAt(draft, [...IMAGE, key], fallback)} onChange={set(key)} />
        </div>
      ))}
    </div>
  );
}
