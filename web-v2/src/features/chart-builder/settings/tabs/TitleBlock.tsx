import { textAt, boolAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { AlignSetting } from '../fields/AlignSetting';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import { TITLE_DEFAULTS, titleRevert, type TitleKey } from './commonTabs.utils';
import type { TabProps } from './tabProps';

export interface TitleBlockProps extends TabProps {
  name: TitleKey;
  /** v1 shows the on / off toggles on tables only. */
  toggles: boolean;
}

const LABELS: Record<TitleKey, { name: string; placeholder: string }> = {
  title: { name: 'Title', placeholder: 'Input Title' },
  subtitle: { name: 'Subtitle', placeholder: 'Input Subtitle' }
};

/** One of the title and subtitle: its text and style. */
export function TitleBlock({ viz, onChange, toggles, name }: TitleBlockProps) {
  const defaults = TITLE_DEFAULTS[name];
  const set = (path: string) => (value: unknown) => onChange({ [`${name}.${path}`]: value });
  const { name: label, placeholder } = LABELS[name];
  return (
    <div className="flex flex-col gap-3">
      {toggles && <ToggleSetting label={label} value={boolAt(viz, `${name}.enabled`, defaults.enabled)} onChange={set('enabled')} />}
      <TextSetting label={`${label} text`} placeholder={placeholder} value={textAt(viz, `${name}.text`, defaults.text)} onChange={set('text')} />
      <SelectSetting label="Font family" options={FONT_FAMILIES} value={textAt(viz, `${name}.style.fontFamily`, defaults.fontFamily)} onChange={set('style.fontFamily')} />
      <div className="flex items-end gap-3">
        <ColorSetting className="w-32" label="Font color" value={textAt(viz, `${name}.style.color`, defaults.color)} onChange={set('style.color')} />
        <SelectSetting className="w-20" label="Text size" options={FONT_SIZES} value={textAt(viz, `${name}.style.fontSize`, defaults.fontSize)} onChange={set('style.fontSize')} />
        <AlignSetting label="Alignment" value={textAt(viz, `${name}.align`, defaults.align)} onChange={set('align')} />
      </div>
      <RevertButton onRevert={() => onChange(titleRevert(name))} />
    </div>
  );
}
