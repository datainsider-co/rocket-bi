import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import type { TabProps } from '../tabs/tabProps';
import { TABLE_THEME_OPTIONS, tableThemeChanges, tableThemeOf } from './tableTabs.utils';

/** v1 table `StyleTab`: a theme restyles the grid, header, rows, title and card at once. */
export function TableStyleTab({ viz, onChange }: TabProps) {
  return (
    <div className="flex flex-col gap-3">
      <SelectSetting label="Select style" options={TABLE_THEME_OPTIONS} value={tableThemeOf(viz)} onChange={key => onChange(tableThemeChanges(key))} />
      <RevertButton onRevert={() => onChange(tableThemeChanges('default'))} />
    </div>
  );
}
