import { boolAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { AxisFieldProps } from './axisFieldProps';
import { AXIS_DEFAULTS } from './seriesTabs.utils';

interface AxisTitleFieldsProps extends AxisFieldProps {
  /** Shown while the axis has no title of its own: its field's name. */
  defaultTitle: string;
}

/** An axis' title: on / off, text and font. */
export function AxisTitleFields({ viz, onChange, axis, disabled, defaultTitle }: AxisTitleFieldsProps) {
  const set = (path: string) => (value: unknown) => onChange({ [`${axis}.${path}`]: value });
  const off = disabled || !boolAt(viz, `${axis}.title.enabled`, true);
  return (
    <>
      <ToggleSetting label="Axis title" disabled={disabled} value={boolAt(viz, `${axis}.title.enabled`, true)} onChange={set('title.enabled')} />
      <TextSetting label="Title text" placeholder="Input Axis Title" disabled={off} value={textAt(viz, `${axis}.title.text`, defaultTitle)} onChange={set('title.text')} />
      <SelectSetting label="Font family" options={FONT_FAMILIES} disabled={off} value={textAt(viz, `${axis}.title.style.fontFamily`, AXIS_DEFAULTS.font)} onChange={set('title.style.fontFamily')} />
      <div className="flex gap-3">
        <ColorSetting className="w-32" label="Font color" disabled={off} value={textAt(viz, `${axis}.title.style.color`, AXIS_DEFAULTS.color)} onChange={set('title.style.color')} />
        <SelectSetting className="w-20" label="Text size" options={FONT_SIZES} disabled={off} value={textAt(viz, `${axis}.title.style.fontSize`, AXIS_DEFAULTS.fontSize)} onChange={set('title.style.fontSize')} />
      </div>
    </>
  );
}
