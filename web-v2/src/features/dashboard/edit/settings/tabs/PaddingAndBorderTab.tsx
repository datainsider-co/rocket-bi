import { numberAt, stringAt, withPath } from '../dashboardSettings.utils';
import { ColorInput } from '../fields/ColorInput';
import { PercentInput } from '../fields/PercentInput';
import { PixelInput } from '../fields/PixelInput';
import { RadiusInput } from '../fields/RadiusInput';
import { SettingField } from '../fields/SettingField';
import type { SettingsSectionProps } from '../settingsSection';

const WIDGET = ['widget_setting'];

/** v1 `PaddingAndBorderSetting`: every widget's padding, border and corner radius. */
export function PaddingAndBorderTab({ draft, onChange }: SettingsSectionProps) {
  const at = (path: string[]) => [...WIDGET, ...path];
  const set = (path: string[]) => (value: unknown) => onChange(withPath(draft, at(path), value));
  return (
    <div className="setting-tab">
      <h6 className="setting-tab__title">Padding</h6>
      <p className="setting-tab__subtitle setting-tab__subtitle--tight">Padding is the space between the content inside the element and the outer boundary of the element.</p>
      <SettingField label="Padding (px)" className="mb-[22px] w-[160px]">
        <PixelInput label="Padding" value={numberAt(draft, at(['padding']), 15)} onChange={set(['padding'])} />
      </SettingField>
      <h6 className="setting-tab__title">Border</h6>
      <p className="setting-tab__subtitle setting-tab__subtitle--tight">Border is the outline surrounding the element with different border styles and colors.</p>
      <div className="setting-row mb-[25px] gap-4">
        <SettingField label="Border width (px)" className="w-[160px]">
          <PixelInput label="Border width" icon="di-icon-stroke-weight" value={numberAt(draft, at(['border', 'width']), 0)} onChange={set(['border', 'width'])} />
        </SettingField>
        <SettingField label="Border color" className="w-[160px]">
          <ColorInput label="Border color" value={stringAt(draft, at(['border', 'color']), '#f2f2f7')} onChange={set(['border', 'color'])} />
        </SettingField>
        <SettingField label="Border Opacity" className="w-[160px]">
          <PercentInput label="Border opacity" value={numberAt(draft, at(['border', 'color_opacity']), 100)} onChange={set(['border', 'color_opacity'])} />
        </SettingField>
      </div>
      <div className="w-[354px]">
        <RadiusInput draft={draft} path={at(['border', 'radius'])} onChange={onChange} />
      </div>
    </div>
  );
}
