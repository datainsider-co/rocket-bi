import { textAt } from '../vizValue.utils';
import { FONT_FAMILIES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import type { TabProps } from '../tabs/tabProps';
import { TABLE_TOOLTIP_DEFAULTS as D, tableTooltipRevert } from './tableTabs.utils';

/** v1 table `TooltipTab`: the cell tooltip's text color, background and font. */
export function TableTooltipTab({ viz, onChange }: TabProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <ColorSetting className="flex-1" label="Color" value={textAt(viz, 'tooltip.valueColor', D.valueColor)} onChange={color => onChange({ 'tooltip.valueColor': color })} />
        <ColorSetting className="flex-1" label="Background color" value={textAt(viz, 'tooltip.backgroundColor', D.backgroundColor)} onChange={color => onChange({ 'tooltip.backgroundColor': color })} />
      </div>
      <SelectSetting label="Font family" options={FONT_FAMILIES} value={textAt(viz, 'tooltip.fontFamily', D.fontFamily)} onChange={font => onChange({ 'tooltip.fontFamily': font })} />
      <RevertButton onRevert={() => onChange(tableTooltipRevert())} />
    </div>
  );
}
