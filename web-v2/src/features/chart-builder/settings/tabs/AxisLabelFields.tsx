import { textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import type { AxisFieldProps } from './axisFieldProps';
import { AXIS_DEFAULTS } from './seriesTabs.utils';

/** An axis' labels: prefix, postfix and font. */
export function AxisLabelFields({ viz, onChange, axis, disabled }: AxisFieldProps) {
  const set = (path: string) => (value: string) => onChange({ [`${axis}.${path}`]: value });
  return (
    <>
      <div className="flex gap-3">
        <TextSetting
          className="flex-1"
          label="Prefix"
          placeholder="Input Prefix"
          maxLength={AXIS_DEFAULTS.affixMaxLength}
          disabled={disabled}
          value={textAt(viz, `${axis}.prefix.text`, '')}
          onChange={set('prefix.text')}
        />
        <TextSetting
          className="flex-1"
          label="Postfix"
          placeholder="Input Postfix"
          maxLength={AXIS_DEFAULTS.affixMaxLength}
          disabled={disabled}
          value={textAt(viz, `${axis}.postfix.text`, '')}
          onChange={set('postfix.text')}
        />
      </div>
      <SelectSetting label="Font family" options={FONT_FAMILIES} disabled={disabled} value={textAt(viz, `${axis}.labels.style.fontFamily`, AXIS_DEFAULTS.font)} onChange={set('labels.style.fontFamily')} />
      <div className="flex gap-3">
        <ColorSetting className="w-32" label="Font color" disabled={disabled} value={textAt(viz, `${axis}.labels.style.color`, AXIS_DEFAULTS.color)} onChange={set('labels.style.color')} />
        <SelectSetting className="w-20" label="Text size" options={FONT_SIZES} disabled={disabled} value={textAt(viz, `${axis}.labels.style.fontSize`, AXIS_DEFAULTS.fontSize)} onChange={set('labels.style.fontSize')} />
      </div>
    </>
  );
}
