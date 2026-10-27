import { asRecord, asString, type JsonObject } from '@/core/json/json';
import { ColorSetting } from '../fields/ColorSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { ToggleSetting } from '../fields/ToggleSetting';

interface BoundFieldsProps {
  label: string;
  /** What the default bound is ("Lowest value", ...). */
  defaultLabel: string;
  bound: unknown;
  withColor: boolean;
  /** The scale's center can be turned off. */
  toggle?: boolean;
  invalid: boolean;
  onChange: (bound: JsonObject) => void;
}

/** A scale or data bar end (v1 `ValueColorPicker`): the column's lowest / highest value or a custom one, and its color. */
export function BoundFields({ label, defaultLabel, bound, withColor, toggle = false, invalid, onChange }: BoundFieldsProps) {
  const value = asRecord(bound);
  const set = (key: string) => (next: unknown) => onChange({ ...value, [key]: next });
  const off = toggle && value['enabled'] !== true;
  return (
    <div className="flex flex-col gap-2">
      {toggle ? <ToggleSetting label={label} value={!off} onChange={set('enabled')} /> : <span className="text-sm font-medium">{label}</span>}
      <div className="flex items-end gap-3">
        <SelectSetting
          className="flex-1"
          label="Type"
          disabled={off}
          options={[
            { label: defaultLabel, value: 'default' },
            { label: 'Custom', value: 'custom' }
          ]}
          value={asString(value['type'], 'default')}
          onChange={set('type')}
        />
        {value['type'] === 'custom' && <TextSetting className="w-28" label={invalid ? 'Value (a number)' : 'Value'} disabled={off} value={asString(value['value'], String(value['value'] ?? ''))} onChange={set('value')} />}
        {withColor && <ColorSetting className="w-32" label="Color" disabled={off} value={asString(value['color'], '#d2f4ff')} onChange={set('color')} />}
      </div>
    </div>
  );
}
