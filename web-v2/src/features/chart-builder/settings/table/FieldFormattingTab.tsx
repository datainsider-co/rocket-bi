import { useState } from 'react';
import { DISPLAY_UNITS, PRECISIONS } from '../settingOptions';
import { boolAt, numberAt, textAt } from '../vizValue.utils';
import { AlignSetting } from '../fields/AlignSetting';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import { FIELD_DEFAULTS as D, fieldApplyChanges, fieldFormattingRevert, fieldPath, type ColumnChoice } from './formattingTabs.utils';

/**
 * v1 `FieldFormattingTab`: one column's colors and alignment, on its header and / or values, and its own number format.
 * v1's Apply to total did nothing on a flatten table (no total row), so it is left out.
 */
export function FieldFormattingTab({ viz, onChange, columns }: TabProps & { columns: readonly ColumnChoice[] }) {
  const [picked, setPicked] = useState<string>();
  const column = columns.find(choice => choice.value === picked) ?? columns[0];
  if (!column) return null;
  const key = column.value;
  const set = (path: string) => (value: unknown) => onChange({ [fieldPath(key, path)]: value });
  const tableUnit = textAt(viz, 'plotOptions.table.dataLabels.displayUnit', 'none');
  return (
    <div className="flex flex-col gap-3">
      <SelectSetting label="Select field" options={columns} value={key} onChange={setPicked} />
      <div className="flex items-end gap-3">
        <ColorSetting className="w-32" label="Font color" value={textAt(viz, fieldPath(key, 'style.color'), D.color)} onChange={set('style.color')} />
        <ColorSetting className="w-32" label="Background color" value={textAt(viz, fieldPath(key, 'backgroundColor'), D.backgroundColor)} onChange={set('backgroundColor')} />
        <AlignSetting label="Alignment" value={textAt(viz, fieldPath(key, 'align'), D.align)} onChange={set('align')} />
      </div>
      <ToggleSetting label="Apply to header" value={boolAt(viz, fieldPath(key, 'applyHeader'), false)} onChange={enabled => onChange(fieldApplyChanges(viz, key, 'applyHeader', enabled))} />
      <ToggleSetting label="Apply to values" value={boolAt(viz, fieldPath(key, 'applyValues'), false)} onChange={enabled => onChange(fieldApplyChanges(viz, key, 'applyValues', enabled))} />
      <div className="flex gap-3">
        <SelectSetting className="flex-1" label="Display unit" options={DISPLAY_UNITS} value={textAt(viz, fieldPath(key, 'displayUnit'), tableUnit)} onChange={set('displayUnit')} />
        <SelectSetting className="w-24" label="Precision" options={PRECISIONS} value={numberAt(viz, fieldPath(key, 'precision'), numberAt(viz, 'precision', D.precision))} onChange={set('precision')} />
      </div>
      <RevertButton onRevert={() => onChange(fieldFormattingRevert(key))} />
    </div>
  );
}
