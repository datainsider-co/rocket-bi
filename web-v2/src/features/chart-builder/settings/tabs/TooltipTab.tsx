import { textAt } from '../vizValue.utils';
import { FONT_FAMILIES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TOOLTIP_DEFAULTS, tooltipRevert } from './commonTabs.utils';
import type { TabProps } from './tabProps';

/**
 * v1 `TooltipTab`: the tooltip's text color, background and font. v1 saved the font under `tooltip.fontFamily`, which
 * neither the tab nor the chart read; v2 saves it under `tooltip.style`.
 */
export function TooltipTab({ viz, onChange }: TabProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <ColorSetting className="flex-1" label="Color" value={textAt(viz, 'tooltip.style.color', TOOLTIP_DEFAULTS.color)} onChange={color => onChange({ 'tooltip.style.color': color })} />
        <ColorSetting
          className="flex-1"
          label="Background color"
          value={textAt(viz, 'tooltip.backgroundColor', TOOLTIP_DEFAULTS.backgroundColor)}
          onChange={color => onChange({ 'tooltip.backgroundColor': color })}
        />
      </div>
      <SelectSetting
        label="Font family"
        options={FONT_FAMILIES}
        value={textAt(viz, 'tooltip.style.fontFamily', TOOLTIP_DEFAULTS.fontFamily)}
        onChange={font => onChange({ 'tooltip.style.fontFamily': font })}
      />
      <RevertButton onRevert={() => onChange(tooltipRevert())} />
    </div>
  );
}
