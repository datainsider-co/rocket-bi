import { tabFilterColors } from '@/features/dashboard/charts/filter/filterStyle.utils';
import { boolAt, textAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { DefaultValueField, type DefaultValueFieldProps } from './DefaultValueField';
import { DIRECTIONS, displayAsOf, tabColorKeys, tabControlRevert, tabControlSettingsOf } from './filterTabs.utils';

interface TabControlTabProps extends TabProps {
  chartType: string;
  defaultValue: DefaultValueFieldProps;
}

/** v1 `TabFilterControlTab`: direction, colors and search box of tab and choice filters, and their default value. */
export function TabControlTab({ viz, onChange, chartType, defaultValue }: TabControlTabProps) {
  const displayAs = displayAsOf(viz);
  const shown = tabControlSettingsOf(chartType, displayAs);
  const keys = tabColorKeys(displayAs);
  const colors = tabFilterColors(viz, displayAs);
  const searchOn = boolAt(viz, 'search.enabled', true);
  return (
    <div className="flex flex-col gap-3">
      {shown.direction && <SelectSetting label="Position" options={DIRECTIONS} value={textAt(viz, 'direction', 'row')} onChange={direction => onChange({ direction })} />}
      {shown.colors && (
        <div className="flex gap-3">
          <ColorSetting className="flex-1" label="Inactive background" value={colors.deActive} onChange={color => onChange({ [keys.deActive]: color })} />
          <ColorSetting className="flex-1" label="Active background" value={colors.active} onChange={color => onChange({ [keys.active]: color })} />
        </div>
      )}
      {shown.search && (
        <>
          <ToggleSetting label="Search box" value={searchOn} onChange={enabled => onChange({ 'search.enabled': enabled })} />
          <TextSetting
            label="Search placeholder"
            placeholder="Input placeholder"
            disabled={!searchOn}
            value={textAt(viz, 'search.placeholder', 'Search...')}
            onChange={placeholder => onChange({ 'search.placeholder': placeholder })}
          />
        </>
      )}
      <DefaultValueField {...defaultValue} />
      <RevertButton onRevert={() => onChange(tabControlRevert())} />
    </div>
  );
}
