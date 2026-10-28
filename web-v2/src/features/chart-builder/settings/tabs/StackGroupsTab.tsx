import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { STACKINGS, stackGroupChange, stackingValueOf, type StackGroupRow } from './stackedTabs.utils';
import type { TabProps } from './tabProps';

interface StackGroupsTabProps extends TabProps {
  /** The preview's series with their stacks (`stackGroupsOf`). */
  groups: readonly StackGroupRow[];
}

/** v1 `StackTab`: stacked by value or percentage, and the stack each series goes into. */
export function StackGroupsTab({ viz, onChange, groups }: StackGroupsTabProps) {
  return (
    <div className="flex flex-col gap-3">
      <SelectSetting label="Stack" options={STACKINGS} value={stackingValueOf(viz)} onChange={stacking => onChange({ 'plotOptions.series.stacking': stacking })} />
      {groups.map(group => (
        <TextSetting key={group.key} label={group.name} placeholder="Input Stack Group" value={group.stack} onChange={value => onChange(stackGroupChange(group.key, value))} />
      ))}
    </div>
  );
}
