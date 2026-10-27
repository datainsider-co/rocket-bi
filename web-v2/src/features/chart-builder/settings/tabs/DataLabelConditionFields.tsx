import { boolAt, numberAt } from '../vizValue.utils';
import { MAX_COMPARISONS, MIN_COMPARISONS } from '../settingOptions';
import { NumberSetting } from '../fields/NumberSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import { boundToggle, DATA_LABEL_DEFAULTS } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

interface DataLabelConditionFieldsProps extends TabProps {
  /** The condition's lodash path (`plotOptions.series.dataLabels.condition`). */
  path: string;
  disabled: boolean;
}

/** v1's data label condition: only values above a min and / or below a max get a label. */
export function DataLabelConditionFields({ viz, onChange, path, disabled }: DataLabelConditionFieldsProps) {
  const on = !disabled && boolAt(viz, `${path}.enabled`, false);
  const bound = (name: 'min' | 'max', label: string) => {
    const boundPath = `${path}.${name}`;
    const value = numberAt(viz, `${boundPath}.value`, DATA_LABEL_DEFAULTS[name]);
    const enabled = boolAt(viz, `${boundPath}.enabled`, false);
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <ToggleSetting label={label} disabled={!on} value={enabled} onChange={next => onChange(boundToggle(boundPath, next, value))} />
        <SelectSetting
          label={`${label} comparison`}
          options={name === 'min' ? MIN_COMPARISONS : MAX_COMPARISONS}
          disabled={!on || !enabled}
          value={String(boolAt(viz, `${boundPath}.equal`, false))}
          onChange={equal => onChange({ [`${boundPath}.equal`]: equal === 'true' })}
        />
        <NumberSetting label={`${label} value`} disabled={!on || !enabled} value={value} onChange={next => onChange({ [`${boundPath}.value`]: next })} />
      </div>
    );
  };
  return (
    <>
      <ToggleSetting label="Condition" disabled={disabled} value={on} onChange={enabled => onChange({ [`${path}.enabled`]: enabled })} />
      <div className="flex gap-3">
        {bound('min', 'Min')}
        {bound('max', 'Max')}
      </div>
    </>
  );
}
