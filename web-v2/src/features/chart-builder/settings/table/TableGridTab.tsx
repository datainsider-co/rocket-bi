import { boolAt, textAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { GRID_DEFAULTS as D, gridRevert, THICKNESSES } from './tableTabs.utils';

/**
 * v1 table `GridTab`: vertical lines (in the header, between cells) and horizontal ones (between rows). The Total
 * toggles and the horizontal Header one (between header rows) only show for a pivot table, the table that has a total
 * row and several header rows; they did nothing on the others.
 */
export function TableGridTab({ viz, onChange, pivot = false }: TabProps & { pivot?: boolean }) {
  const toggle = (path: string, label: string, fallback: boolean) => (
    <ToggleSetting label={label} value={boolAt(viz, `grid.${path}`, fallback)} onChange={value => onChange({ [`grid.${path}`]: value })} />
  );
  const line = (direction: 'vertical' | 'horizontal', label: string) => (
    <div className="flex gap-3">
      <ColorSetting className="flex-1" label={label} value={textAt(viz, `grid.${direction}.color`, D.color)} onChange={color => onChange({ [`grid.${direction}.color`]: color })} />
      <SelectSetting
        className="w-24"
        label="Thickness"
        options={THICKNESSES}
        value={textAt(viz, `grid.${direction}.thickness`, D.thickness)}
        onChange={thickness => onChange({ [`grid.${direction}.thickness`]: thickness })}
      />
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      {line('vertical', 'Vertical grid color')}
      {toggle('vertical.applyHeader', 'Header', D.vertical.applyHeader)}
      {toggle('vertical.applyBody', 'Body', D.vertical.applyBody)}
      {pivot && toggle('vertical.applyTotal', 'Total', D.vertical.applyTotal)}
      {line('horizontal', 'Horizontal grid color')}
      {pivot && toggle('horizontal.applyHeader', 'Header', D.horizontal.applyHeader)}
      {toggle('horizontal.applyBody', 'Body', D.horizontal.applyBody)}
      {pivot && toggle('horizontal.applyTotal', 'Total', D.horizontal.applyTotal)}
      <RevertButton onRevert={() => onChange(gridRevert())} />
    </div>
  );
}
