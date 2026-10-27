import type { JsonObject } from '@/core/json/json';
import { numberAt, stringAt, withPath } from '../dashboardSettings.utils';
import { ColorInput } from '../fields/ColorInput';
import { PercentInput } from '../fields/PercentInput';
import { SettingField } from '../fields/SettingField';

interface ColorOpacityFieldsProps {
  draft: JsonObject;
  /** Path of a `{ color, opacity }` background. */
  path: readonly string[];
  /** Names the inputs for screen readers ("Dashboard color"). */
  name: string;
  fallbackColor: string;
  onChange: (draft: JsonObject) => void;
}

/** v1 `DashboardColorSetting` and `WidgetColorSetting`: a color and its opacity, side by side. */
export function ColorOpacityFields({ draft, path, name, fallbackColor, onChange }: ColorOpacityFieldsProps) {
  return (
    <div className="setting-row gap-4">
      <SettingField label="Color" className="w-[160px]">
        <ColorInput label={`${name} color`} value={stringAt(draft, [...path, 'color'], fallbackColor)} onChange={color => onChange(withPath(draft, [...path, 'color'], color))} />
      </SettingField>
      <SettingField label="Opacity" className="w-[160px]">
        <PercentInput label={`${name} opacity`} value={numberAt(draft, [...path, 'opacity'], 100)} onChange={opacity => onChange(withPath(draft, [...path, 'opacity'], opacity))} />
      </SettingField>
    </div>
  );
}
