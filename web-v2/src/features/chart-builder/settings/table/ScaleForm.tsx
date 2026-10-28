import { asRecord, asString, type JsonObject } from '@/core/json/json';
import { ColorSetting } from '../fields/ColorSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { BoundFields } from './BoundFields';
import { EMPTY_FORMATTING } from './formattingOptions';

interface ScaleFormProps {
  scale: unknown;
  invalid: readonly string[];
  onChange: (scale: JsonObject) => void;
}

/** v1 `ColorScalePanel`: colors from the lowest to the highest value, through an optional center, and empty cells. */
export function ScaleForm({ scale, invalid, onChange }: ScaleFormProps) {
  const value = asRecord(scale);
  const empty = asRecord(value['default']);
  const set = (key: string) => (next: unknown) => onChange({ ...value, [key]: next });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <SelectSetting
          className="flex-1"
          label="Default formatting"
          options={EMPTY_FORMATTING}
          value={asString(empty['formattingType'], 'none')}
          onChange={type => onChange({ ...value, default: { ...empty, formattingType: type } })}
        />
        {empty['formattingType'] === 'specific_color' && (
          <ColorSetting className="w-32" label="Color" value={asString(empty['specificColor'], '#d2f4ff')} onChange={color => onChange({ ...value, default: { ...empty, specificColor: color } })} />
        )}
      </div>
      <BoundFields label="Minimum" defaultLabel="Lowest value" bound={value['min']} withColor invalid={invalid.includes('min')} onChange={set('min')} />
      <BoundFields label="Center" defaultLabel="Middle value" bound={value['center']} withColor toggle invalid={invalid.includes('center')} onChange={set('center')} />
      <BoundFields label="Maximum" defaultLabel="Highest value" bound={value['max']} withColor invalid={invalid.includes('max')} onChange={set('max')} />
    </div>
  );
}
