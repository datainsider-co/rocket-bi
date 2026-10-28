import { asString, type JsonObject } from '@/core/json/json';
import { ColorSetting } from '../fields/ColorSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { BoundFields } from './BoundFields';
import { BAR_DIRECTIONS } from './formattingOptions';
import { invalidBounds, withValue } from './formattingTabs.utils';

/** v1 `DataBarSetting`: the bars' range, direction and colors. */
export function DataBarForm({ config, onChange }: { config: JsonObject; onChange: (config: JsonObject) => void }) {
  const invalid = invalidBounds(config, ['min', 'max']);
  const color = (key: string, label: string, fallback: string) => (
    <ColorSetting className="flex-1" label={label} value={asString(config[key], fallback)} onChange={next => onChange(withValue(config, key, next))} />
  );
  return (
    <div className="flex flex-col gap-3">
      <BoundFields label="Minimum" defaultLabel="Lowest value" bound={config['min']} withColor={false} invalid={invalid.includes('min')} onChange={min => onChange({ ...config, min })} />
      <BoundFields label="Maximum" defaultLabel="Highest value" bound={config['max']} withColor={false} invalid={invalid.includes('max')} onChange={max => onChange({ ...config, max })} />
      <SelectSetting label="Bar direction" options={BAR_DIRECTIONS} value={asString(config['direction'], 'left')} onChange={direction => onChange(withValue(config, 'direction', direction))} />
      <div className="flex gap-3">
        {color('axisColor', 'Axis color', '#E6E6E600')}
        {color('negativeColor', 'Negative bar', '#d8bc71')}
        {color('positiveColor', 'Positive bar', '#6289d2')}
      </div>
    </div>
  );
}
