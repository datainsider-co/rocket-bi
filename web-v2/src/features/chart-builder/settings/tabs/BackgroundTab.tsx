import { textAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { THEME_BACKGROUND } from './commonTabs.utils';
import type { TabProps } from './tabProps';

/** v1 `BackgroundTab`: the card's color. v1 always showed white here, whatever the chart had. */
export function BackgroundTab({ viz, onChange }: TabProps) {
  return (
    <div className="flex flex-col gap-3">
      <ColorSetting className="w-40" label="Color" value={textAt(viz, 'background', THEME_BACKGROUND)} onChange={background => onChange({ background })} />
      <RevertButton onRevert={() => onChange({ background: THEME_BACKGROUND })} />
    </div>
  );
}
