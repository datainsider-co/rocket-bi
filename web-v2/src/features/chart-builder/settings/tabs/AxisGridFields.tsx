import { numberAt, textAt } from '../vizValue.utils';
import { DASH_STYLES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { NumberSetting } from '../fields/NumberSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { AxisFieldProps } from './axisFieldProps';
import { AXIS_DEFAULTS, gridToggle } from './seriesTabs.utils';

/** An axis' gridlines: on / off, color, width and dash. v1 read a grid turned off (`'0'`) as still on. */
export function AxisGridFields({ viz, onChange, axis, disabled }: AxisFieldProps) {
  const width = numberAt(viz, `${axis}.gridLineWidth`, 0);
  const off = disabled || width === 0;
  return (
    <>
      <ToggleSetting label="Gridlines" disabled={disabled} value={width !== 0} onChange={enabled => onChange(gridToggle(axis, enabled))} />
      <div className="flex gap-3">
        <ColorSetting
          className="flex-1"
          label="Grid color"
          disabled={off}
          value={textAt(viz, `${axis}.gridLineColor`, AXIS_DEFAULTS.gridLineColor)}
          onChange={color => onChange({ [`${axis}.gridLineColor`]: color })}
        />
        <NumberSetting className="w-24" label="Width" min={0} step={0.5} disabled={off} value={width} onChange={next => onChange({ [`${axis}.gridLineWidth`]: next })} />
      </div>
      <SelectSetting
        label="Dash style"
        options={DASH_STYLES}
        disabled={off}
        value={textAt(viz, `${axis}.gridLineDashStyle`, AXIS_DEFAULTS.gridLineDashStyle)}
        onChange={dash => onChange({ [`${axis}.gridLineDashStyle`]: dash })}
      />
    </>
  );
}
