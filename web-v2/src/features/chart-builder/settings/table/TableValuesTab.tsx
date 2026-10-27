import { boolAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { VALUE_DEFAULTS as D, valuesRevert } from './tableTabs.utils';

/** v1 table `ValuesTab`: the rows' colors, every other row's, the font and text wrap. */
export function TableValuesTab({ viz, onChange }: TabProps) {
  const set = (path: string) => (value: unknown) => onChange({ [`value.${path}`]: value });
  const color = (path: string, label: string, fallback: string) => <ColorSetting className="flex-1" label={label} value={textAt(viz, `value.${path}`, fallback)} onChange={set(path)} />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {color('color', 'Font color', D.color)}
        {color('backgroundColor', 'Background color', D.backgroundColor)}
      </div>
      <div className="flex gap-3">
        {color('alternateColor', 'Alternate font color', D.alternateColor)}
        {color('alternateBackgroundColor', 'Alternate background color', D.alternateBackgroundColor)}
      </div>
      <ToggleSetting label="Text wrap" value={boolAt(viz, 'value.style.isWordWrap', D.isWordWrap)} onChange={set('style.isWordWrap')} />
      <div className="flex gap-3">
        <SelectSetting className="flex-1" label="Font family" options={FONT_FAMILIES} value={textAt(viz, 'value.style.fontFamily', D.fontFamily)} onChange={set('style.fontFamily')} />
        <SelectSetting className="w-20" label="Size" options={FONT_SIZES} value={textAt(viz, 'value.style.fontSize', D.fontSize)} onChange={set('style.fontSize')} />
      </div>
      <RevertButton onRevert={() => onChange(valuesRevert())} />
    </div>
  );
}
