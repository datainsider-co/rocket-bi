import { boolAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { AlignSetting } from '@/shared/settings/fields/AlignSetting';
import { ColorSetting } from '@/shared/settings/fields/ColorSetting';
import { RevertButton } from '@/shared/settings/fields/RevertButton';
import { SelectSetting } from '@/shared/settings/fields/SelectSetting';
import { ToggleSetting } from '@/shared/settings/fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { HEADER_DEFAULTS as D, headerRevert } from './tableTabs.utils';

/** v1 table `HeaderTab` (Column headers): font, color, alignment, background and text wrap. */
export function TableHeaderTab({ viz, onChange }: TabProps) {
  const set = (path: string) => (value: unknown) => onChange({ [`header.${path}`]: value });
  return (
    <div className="settings-stack">
      <SelectSetting label="Font family" options={FONT_FAMILIES} value={textAt(viz, 'header.style.fontFamily', D.fontFamily)} onChange={set('style.fontFamily')} />
      <div className="settings-row settings-row--end">
        <ColorSetting label="Font color" value={textAt(viz, 'header.style.color', D.color)} onChange={set('style.color')} />
        <SelectSetting className="settings-size" label="Text size" options={FONT_SIZES} value={textAt(viz, 'header.style.fontSize', D.fontSize)} onChange={set('style.fontSize')} />
        <AlignSetting label="Alignment" value={textAt(viz, 'header.align', D.align)} onChange={set('align')} />
      </div>
      <ColorSetting className="w-40" label="Background color" value={textAt(viz, 'header.backgroundColor', D.backgroundColor)} onChange={set('backgroundColor')} />
      <ToggleSetting label="Text wrap" value={boolAt(viz, 'header.isWordWrap', D.isWordWrap)} onChange={set('isWordWrap')} />
      <RevertButton onRevert={() => onChange(headerRevert())} />
    </div>
  );
}
