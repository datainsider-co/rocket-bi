import { boolAt, textAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { IconGridView } from './IconGridView';
import { ICON_SHAPES, iconRevert, iconToggle, kpiIconDefaults } from './numberTabs.utils';

/** v1 `IconSettingTab`: the card's icon, its color, shape and background. */
export function KpiIconTab({ viz, onChange }: TabProps) {
  const defaults = kpiIconDefaults(viz);
  const off = !boolAt(viz, 'icon.enabled', false);
  const color = textAt(viz, 'icon.color', defaults.color);
  const background = textAt(viz, 'icon.background', defaults.background);
  const set = (path: string) => (value: string) => onChange({ [`icon.${path}`]: value });
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="Show icon" value={!off} onChange={enabled => onChange(iconToggle(enabled, viz))} />
      <IconGridView value={textAt(viz, 'icon.iconClass', defaults.iconClass)} color={color} background={background} disabled={off} onChange={set('iconClass')} />
      <div className="flex gap-3">
        <ColorSetting className="flex-1" label="Icon color" disabled={off} value={color} onChange={set('color')} />
        <ColorSetting className="flex-1" label="Background" disabled={off} value={background} onChange={set('background')} />
      </div>
      <SelectSetting label="Shape" options={ICON_SHAPES} disabled={off} value={textAt(viz, 'icon.border', defaults.border)} onChange={set('border')} />
      <RevertButton onRevert={() => onChange(iconRevert(viz))} />
    </div>
  );
}
