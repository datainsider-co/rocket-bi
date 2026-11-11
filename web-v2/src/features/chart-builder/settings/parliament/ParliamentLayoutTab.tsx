import { textAt } from '../vizValue.utils';
import { PARLIAMENT_LAYOUTS } from '../settingOptions';
import { SelectSetting } from '@/shared/settings/fields/SelectSetting';
import type { TabProps } from '../tabs/tabProps';

/** v1 `ParliamentLayoutTab`: the dots in a half circle, a rectangle or a full circle. */
export function ParliamentLayoutTab({ viz, onChange }: TabProps) {
  return (
    <SelectSetting label="Layout" options={PARLIAMENT_LAYOUTS} value={textAt(viz, 'displayType', 'parliament')} onChange={displayType => onChange({ displayType })} />
  );
}
