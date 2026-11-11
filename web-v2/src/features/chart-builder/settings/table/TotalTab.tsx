import { boolAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { AlignSetting } from '../fields/AlignSetting';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { TOTAL_DEFAULTS as D, totalRevert } from './tableTabs.utils';

/**
 * v1 pivot `TotalTab`: the total row on or off, its label, font, color, the totals' alignment and the row's background.
 */
export function TotalTab({ viz, onChange }: TabProps) {
  const set = (path: string) => (value: unknown) => onChange({ [`total.${path}`]: value });
  return (
    <div className="settings-stack">
      <ToggleSetting label="Show total" value={boolAt(viz, 'total.enabled', D.enabled)} onChange={set('enabled')} />
      <TextSetting label="Label" value={textAt(viz, 'total.label.text', D.label)} onChange={set('label.text')} />
      <SelectSetting label="Font family" options={FONT_FAMILIES} value={textAt(viz, 'total.label.style.fontFamily', D.fontFamily)} onChange={set('label.style.fontFamily')} />
      <div className="settings-row settings-row--end">
        <ColorSetting label="Font color" value={textAt(viz, 'total.label.style.color', D.color)} onChange={set('label.style.color')} />
        <SelectSetting className="settings-size" label="Text size" options={FONT_SIZES} value={textAt(viz, 'total.label.style.fontSize', D.fontSize)} onChange={set('label.style.fontSize')} />
        <AlignSetting label="Alignment" value={textAt(viz, 'total.label.align', D.align)} onChange={set('label.align')} />
      </div>
      <ColorSetting className="w-40" label="Background color" value={textAt(viz, 'total.backgroundColor', D.backgroundColor)} onChange={set('backgroundColor')} />
      <RevertButton onRevert={() => onChange(totalRevert())} />
    </div>
  );
}
