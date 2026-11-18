import { LinkOutlined } from '@ant-design/icons';
import { Input, InputNumber, Select, Space, Switch } from 'antd';
import { SizeUnit } from '@/core/dashboard/DashboardSetting';
import { booleanAt, isPixelWidth, numberAt, paddingOf, stringAt, withPadding, withPath } from '../dashboardSettings.utils';
import { ColorInput } from '../fields/ColorInput';
import { PercentInput } from '../fields/PercentInput';
import { PixelInput } from '../fields/PixelInput';
import { RadiusInput } from '../fields/RadiusInput';
import { SettingField } from '../fields/SettingField';
import { SIZE_UNITS, STROKE_POSITIONS } from '../settingOptions';
import type { SettingsSectionProps } from '../settingsSection';

/**
 * v1 `DashboardSizeSetting`: the dashboard's width (its height follows the widgets), corner radius and stroke. Saved
 * with the theme's look until changed here. Then the padding around the widgets, which v1 stores but gives no input
 * for, and "Disable Responsive" for a width in pixels.
 */
export function DashboardSizeTab({ draft, onChange }: SettingsSectionProps) {
  const set = (path: string[]) => (value: unknown) => onChange(withPath(draft, path, value));
  return (
    <div className="setting-tab">
      <h6 className="setting-tab__title">Dashboard Size</h6>
      <p className="setting-tab__subtitle">Please enter the dimensions WxH below.</p>
      <div className="setting-row mb-[22px]">
        <SettingField label="Width" className="w-[177px]">
          <Space.Compact className="w-full">
            <InputNumber<number>
              aria-label="Width"
              className="setting-input w-full!"
              min={0}
              controls={false}
              placeholder="1000"
              value={numberAt(draft, ['size', 'width'], 100)}
              onChange={value => set(['size', 'width'])(value ?? 0)}
            />
            <Select
              aria-label="Width unit"
              className="setting-input w-[60px]! shrink-0"
              value={stringAt(draft, ['size', 'width_unit'], SizeUnit.Percent)}
              onChange={set(['size', 'width_unit'])}
              options={[...SIZE_UNITS]}
            />
          </Space.Compact>
        </SettingField>
        <LinkOutlined className="setting-size-link" rotate={-45} aria-hidden />
        <SettingField label="Height" className="w-[177px]">
          <Input aria-label="Height" className="setting-input" value="auto" disabled />
        </SettingField>
      </div>
      <div className="mb-[22px] w-[388px]">
        <RadiusInput draft={draft} path={['border', 'radius']} onChange={onChange} />
      </div>
      <h6 className="setting-tab__title">Stroke</h6>
      <div className="setting-row setting-row--fill">
        <SettingField label="Stroke Weight (px)">
          <PixelInput label="Stroke weight" icon="di-icon-stroke-weight" value={numberAt(draft, ['border', 'width'], 1)} onChange={set(['border', 'width'])} />
        </SettingField>
        <SettingField label="Stroke color">
          <ColorInput label="Stroke color" value={stringAt(draft, ['border', 'color'], '#f2f2f7')} onChange={set(['border', 'color'])} />
        </SettingField>
        <SettingField label="Stroke Opacity">
          <PercentInput label="Stroke opacity" value={numberAt(draft, ['border', 'color_opacity'], 100)} onChange={set(['border', 'color_opacity'])} />
        </SettingField>
        <SettingField label="Stroke Position">
          <Select
            aria-label="Stroke position"
            className="setting-input w-full"
            value={stringAt(draft, ['border', 'position'], 'outside')}
            onChange={set(['border', 'position'])}
            options={[...STROKE_POSITIONS]}
          />
        </SettingField>
      </div>
      <h6 className="setting-tab__title mt-[10px]">Padding</h6>
      <p className="setting-tab__subtitle setting-tab__subtitle--tight">Padding is the space between the dashboard's edge and its widgets. Leave it empty for the default.</p>
      <SettingField label="Padding (px)" className="mb-[22px] w-[160px]">
        <InputNumber<number>
          aria-label="Dashboard padding"
          className="setting-input w-full!"
          min={0}
          controls={false}
          placeholder="Default"
          value={paddingOf(draft) ?? null}
          onChange={value => onChange(withPadding(draft, value))}
        />
      </SettingField>
      {isPixelWidth(draft) && (
        <>
          <h6 className="setting-tab__title">Responsive Settings</h6>
          <div className="setting-toggle">
            <label htmlFor="dashboard-freeze">Disable Responsive</label>
            <Switch id="dashboard-freeze" size="small" checked={booleanAt(draft, ['enable_freeze'])} onChange={set(['enable_freeze'])} />
          </div>
          <p className="setting-toggle__hint">When enabled, the dashboard will maintain its fixed width and won't adapt to smaller screens.</p>
        </>
      )}
    </div>
  );
}
