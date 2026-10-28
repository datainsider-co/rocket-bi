import { boolAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { ToggleSetting } from '../fields/ToggleSetting';
import { paletteColorsOf, themeColorRevert, themeColorToggle } from './commonTabs.utils';
import type { TabProps } from './tabProps';

interface ColorTabProps extends TabProps {
  /** The dashboard theme's series colors. */
  themeColors: readonly string[];
}

/** v1 `ColorTab` (Data Color): the theme's colors (Auto), or ten of the chart's own. */
export function ColorTab({ viz, onChange, themeColors }: ColorTabProps) {
  const auto = boolAt(viz, 'themeColor.enabled', true);
  const colors = paletteColorsOf(viz, themeColors);
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="Auto" value={auto} onChange={enabled => onChange(themeColorToggle(enabled, colors))} />
      <div className="grid grid-cols-2 gap-3">
        {colors.map((color, index) => (
          <ColorSetting
            // The palette has a fixed length: the index is the color's identity.
            key={index}
            label={`Color ${index + 1}`}
            value={color}
            disabled={auto}
            onChange={next => onChange({ [`themeColor.colors[${index}]`]: next })}
          />
        ))}
      </div>
      <RevertButton onRevert={() => onChange(themeColorRevert(themeColors))} />
    </div>
  );
}
