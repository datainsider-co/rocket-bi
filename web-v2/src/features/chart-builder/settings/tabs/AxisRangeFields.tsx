import { boolAt, numberAt } from '../vizValue.utils';
import { NumberSetting } from '../fields/NumberSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { AxisFieldProps } from './axisFieldProps';
import { AXIS_DEFAULTS, boundToggle } from './seriesTabs.utils';

/** A y axis' min and max (v1 "Config Min Max For Y-Axis"). */
export function AxisRangeFields({ viz, onChange, axis, disabled }: AxisFieldProps) {
  const condition = `${axis}.condition`;
  const on = !disabled && boolAt(viz, `${condition}.enabled`, false);
  const bound = (name: 'min' | 'max', label: string) => {
    const path = `${condition}.${name}`;
    const value = numberAt(viz, `${path}.value`, AXIS_DEFAULTS[name]);
    const enabled = boolAt(viz, `${path}.enabled`, false);
    return (
      <div className="flex flex-1 flex-col gap-2">
        <ToggleSetting label={label} disabled={!on} value={enabled} onChange={next => onChange(boundToggle(path, next, value))} />
        <NumberSetting label={`${label} value`} disabled={!on || !enabled} value={value} onChange={next => onChange({ [`${path}.value`]: next })} />
      </div>
    );
  };
  return (
    <>
      <ToggleSetting label="Config min max" disabled={disabled} value={on} onChange={enabled => onChange({ [`${condition}.enabled`]: enabled })} />
      <div className="flex gap-3">
        {bound('min', 'Min')}
        {bound('max', 'Max')}
      </div>
    </>
  );
}
