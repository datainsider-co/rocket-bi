import { boolAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { ColorSetting } from '@/shared/settings/fields/ColorSetting';
import { RevertButton } from '@/shared/settings/fields/RevertButton';
import { SelectSetting } from '@/shared/settings/fields/SelectSetting';
import { TextSetting } from '@/shared/settings/fields/TextSetting';
import { ToggleSetting } from '@/shared/settings/fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { FILTER_TITLE_DEFAULTS as D, filterTitleRevert } from './filterTabs.utils';

/** v1 `FilterTitleTab`: a filter's title only, no subtitle or alignment. */
export function FilterTitleTab({ viz, onChange }: TabProps) {
  const set = (path: string) => (value: unknown) => onChange({ [`title.${path}`]: value });
  const off = !boolAt(viz, 'title.enabled', D.enabled);
  return (
    <div className="settings-stack">
      <ToggleSetting label="Title" value={!off} onChange={set('enabled')} />
      <TextSetting label="Title text" disabled={off} value={textAt(viz, 'title.text', D.text)} onChange={set('text')} />
      <SelectSetting label="Font family" options={FONT_FAMILIES} disabled={off} value={textAt(viz, 'title.style.fontFamily', D.fontFamily)} onChange={set('style.fontFamily')} />
      <div className="settings-row">
        <ColorSetting label="Font color" disabled={off} value={textAt(viz, 'title.style.color', D.color)} onChange={set('style.color')} />
        <SelectSetting className="settings-size" label="Text size" options={FONT_SIZES} disabled={off} value={textAt(viz, 'title.style.fontSize', D.fontSize)} onChange={set('style.fontSize')} />
      </div>
      <RevertButton onRevert={() => onChange(filterTitleRevert())} />
    </div>
  );
}
