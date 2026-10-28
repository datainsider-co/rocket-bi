import { textAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import type { TabProps } from '../tabs/tabProps';
import { TOGGLE_ICON_DEFAULTS as D, toggleIconRevert } from './tableTabs.utils';

/** v1 `CollapseTab` (Collapsed And Expanded): the colors of the plus / minus square that expands a row. */
export function CollapseTab({ viz, onChange }: TabProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <ColorSetting
          className="flex-1"
          label="Background color"
          value={textAt(viz, 'toggleIcon.backgroundColor', D.backgroundColor)}
          onChange={color => onChange({ 'toggleIcon.backgroundColor': color })}
        />
        <ColorSetting className="flex-1" label="Icon color" value={textAt(viz, 'toggleIcon.color', D.color)} onChange={color => onChange({ 'toggleIcon.color': color })} />
      </div>
      <RevertButton onRevert={() => onChange(toggleIconRevert())} />
    </div>
  );
}
