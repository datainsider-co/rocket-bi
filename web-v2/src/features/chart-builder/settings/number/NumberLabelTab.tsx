import { textAt } from '../vizValue.utils';
import { FONT_FAMILIES, PRIMARY_FONT_SIZES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import type { TabProps } from '../tabs/tabProps';
import { NUMBER_LABEL_DEFAULTS as D, numberLabelRevert } from './numberTabs.utils';

const PARTS = [
  { key: 'style', name: 'Value', text: undefined },
  { key: 'prefix', name: 'Prefix', text: 'prefix.text' },
  { key: 'postfix', name: 'Postfix', text: 'postfix.text' }
] as const;

/** v1 `NumberDataLabelTab`: the value's font, and the prefix and postfix around it. */
export function NumberLabelTab({ viz, onChange }: TabProps) {
  return (
    <div className="flex flex-col gap-3">
      {PARTS.map(({ key, name, text }) => {
        const style = key === 'style' ? 'style' : `${key}.style`;
        const set = (path: string) => (value: string) => onChange({ [path]: value });
        return (
          <div key={key} className="flex flex-col gap-3">
            {text && <TextSetting label={name} placeholder={`Input ${name}`} maxLength={D.affixMaxLength} value={textAt(viz, text, '')} onChange={set(text)} />}
            <SelectSetting label={`${name} font family`} options={FONT_FAMILIES} value={textAt(viz, `${style}.fontFamily`, D.fontFamily)} onChange={set(`${style}.fontFamily`)} />
            <div className="flex gap-3">
              <ColorSetting className="w-32" label={`${name} color`} value={textAt(viz, `${style}.color`, D.color)} onChange={set(`${style}.color`)} />
              <SelectSetting className="w-24" label={`${name} size`} options={PRIMARY_FONT_SIZES} value={textAt(viz, `${style}.fontSize`, D.fontSize)} onChange={set(`${style}.fontSize`)} />
            </div>
          </div>
        );
      })}
      <RevertButton onRevert={() => onChange(numberLabelRevert())} />
    </div>
  );
}
