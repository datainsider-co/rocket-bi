import { boolAt, numberAt } from '../vizValue.utils';
import { MAX_COMPARISONS, MIN_COMPARISONS } from '../settingOptions';
import { NumberSetting } from '../fields/NumberSetting';
import { SelectSetting } from '../fields/SelectSetting';
import type { TabProps } from '../tabs/tabProps';
import { DefaultValueField, type DefaultValueFieldProps } from './DefaultValueField';

interface SlicerControlTabProps extends TabProps {
  /** Numbers and date parts step; dates don't (v1 `isNumberSlicer`). */
  hasStep: boolean;
  defaultValue: DefaultValueFieldProps;
}

/** v1 `SlicerTabControl`: the slider's step, its default range and whether its ends are included. */
export function SlicerControlTab({ viz, onChange, hasStep, defaultValue }: SlicerControlTabProps) {
  const comparison = (path: 'from' | 'to', label: string) => (
    <SelectSetting
      className="flex-1"
      label={label}
      options={path === 'from' ? MIN_COMPARISONS : MAX_COMPARISONS}
      value={String(boolAt(viz, `${path}.equal`, false))}
      onChange={equal => onChange({ [`${path}.equal`]: equal === 'true' })}
    />
  );
  return (
    <div className="flex flex-col gap-3">
      {hasStep && <NumberSetting className="w-32" label="Step" min={0} value={numberAt(viz, 'step', 1)} onChange={step => onChange({ step: step > 0 ? step : 1 })} />}
      <DefaultValueField label="Default comparison" {...defaultValue} />
      <div className="flex gap-3">
        {comparison('from', 'From')}
        {comparison('to', 'To')}
      </div>
    </div>
  );
}
