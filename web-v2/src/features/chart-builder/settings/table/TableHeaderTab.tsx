import { boolAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { AlignSetting } from '../fields/AlignSetting';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { HEADER_DEFAULTS as D, headerRevert } from './tableTabs.utils';

/** v1 table `HeaderTab` (Column headers): font, color, alignment, background and text wrap. */
export function TableHeaderTab({ viz, onChange }: TabProps) {
  const set = (path: string) => (value: unknown) => onChange({ [`header.${path}`]: value });
  return (
    <div className="flex flex-col gap-3">
      <SelectSetting label="Font family" options={FONT_FAMILIES} value={textAt(viz, 'header.style.fontFamily', D.fontFamily)} onChange={set('style.fontFamily')} />
      <div className="flex items-end gap-3">
        <ColorSetting className="w-32" label="Font color" value={textAt(viz, 'header.style.color', D.color)} onChange={set('style.color')} />
        <SelectSetting className="w-20" label="Text size" options={FONT_SIZES} value={textAt(viz, 'header.style.fontSize', D.fontSize)} onChange={set('style.fontSize')} />
        <AlignSetting label="Alignment" value={textAt(viz, 'header.align', D.align)} onChange={set('align')} />
      </div>
      <ColorSetting className="w-40" label="Background color" value={textAt(viz, 'header.backgroundColor', D.backgroundColor)} onChange={set('backgroundColor')} />
      <ToggleSetting label="Text wrap" value={boolAt(viz, 'header.isWordWrap', D.isWordWrap)} onChange={set('isWordWrap')} />
      <RevertButton onRevert={() => onChange(headerRevert())} />
    </div>
  );
}
