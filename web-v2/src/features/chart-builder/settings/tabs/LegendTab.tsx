import { boolAt, numberAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES, LEGEND_LAYOUTS, VERTICAL_ALIGNS } from '../settingOptions';
import { AlignSetting } from '../fields/AlignSetting';
import { ColorSetting } from '../fields/ColorSetting';
import { NumberSetting } from '../fields/NumberSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import { LEGEND_DEFAULTS as D, legendHeightToggle, legendRevert, legendStyleChanges } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

/** v1 `LegendTab`: position, layout, title, font and an optional fixed height. */
export function LegendTab({ viz, onChange }: TabProps) {
  const off = !boolAt(viz, 'legend.enabled', D.enabled);
  const set = (path: string) => (value: unknown) => onChange({ [`legend.${path}`]: value });
  const manualHeight = numberAt(viz, 'legend.maxHeight', Number.NaN);
  const hasManualHeight = !Number.isNaN(manualHeight);
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="On" value={!off} onChange={set('enabled')} />
      <SelectSetting label="Position" options={VERTICAL_ALIGNS} disabled={off} value={textAt(viz, 'legend.verticalAlign', D.verticalAlign)} onChange={set('verticalAlign')} />
      <SelectSetting label="Layout" options={LEGEND_LAYOUTS} disabled={off} value={textAt(viz, 'legend.layout', D.layout)} onChange={set('layout')} />
      <TextSetting label="Legend name" placeholder="Input Legend Title" disabled={off} value={textAt(viz, 'legend.title.text', D.title)} onChange={set('title.text')} />
      <SelectSetting
        label="Font family"
        options={FONT_FAMILIES}
        disabled={off}
        value={textAt(viz, 'legend.itemStyle.fontFamily', D.fontFamily)}
        onChange={font => onChange(legendStyleChanges('fontFamily', font))}
      />
      <div className="flex items-end gap-3">
        <ColorSetting className="w-32" label="Font color" disabled={off} value={textAt(viz, 'legend.itemStyle.color', D.color)} onChange={color => onChange(legendStyleChanges('color', color))} />
        <SelectSetting
          className="w-20"
          label="Text size"
          options={FONT_SIZES}
          disabled={off}
          value={textAt(viz, 'legend.itemStyle.fontSize', D.fontSize)}
          onChange={size => onChange(legendStyleChanges('fontSize', size))}
        />
        <AlignSetting label="Alignment" value={textAt(viz, 'legend.align', D.align)} onChange={set('align')} />
      </div>
      <ToggleSetting label="Manual height" disabled={off} value={hasManualHeight} onChange={enabled => onChange(legendHeightToggle(enabled))} />
      {hasManualHeight && <NumberSetting label="Max height" min={0} disabled={off} value={manualHeight} onChange={set('maxHeight')} />}
      <RevertButton onRevert={() => onChange(legendRevert())} />
    </div>
  );
}
