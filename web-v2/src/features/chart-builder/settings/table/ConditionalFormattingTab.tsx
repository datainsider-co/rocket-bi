import { useState } from 'react';
import { boolAt } from '../vizValue.utils';
import { SelectSetting } from '../fields/SelectSetting';
import type { TabProps } from '../tabs/tabProps';
import { ConditionalFormattingModal } from './ConditionalFormattingModal';
import { conditionalPath, formattingOf, formattingSave, formattingToggle, defaultFormatting, type ColumnChoice, type FormattingType } from './formattingTabs.utils';
import { FormattingRow } from './FormattingRow';

const TYPES: readonly { type: FormattingType; label: string }[] = [
  { type: 'backgroundColor', label: 'Background color' },
  { type: 'color', label: 'Font color' },
  { type: 'dataBar', label: 'Data bars' },
  { type: 'icon', label: 'Icons' }
];

/**
 * v1 `ConditionalFormattingTab`: a column's background, font color, data bars and icons, by its values. Only number
 * columns get them: the table computes them from the column's own values and range.
 */
export function ConditionalFormattingTab({ viz, onChange, columns }: TabProps & { columns: readonly ColumnChoice[] }) {
  const numeric = columns.filter(column => column.numeric);
  const [picked, setPicked] = useState<string>();
  const [editing, setEditing] = useState<FormattingType>();
  const column = numeric.find(choice => choice.value === picked) ?? numeric[0];
  if (!column) return <p className="m-0 text-sm text-black/45">Add a number column to format it by its values.</p>;
  return (
    <div className="flex flex-col gap-3">
      <SelectSetting label="Select field" options={numeric} value={column.value} onChange={setPicked} />
      {TYPES.map(({ type, label }) => (
        <FormattingRow
          key={type}
          label={label}
          value={boolAt(viz, `${conditionalPath(column.value, type)}.enabled`, false)}
          onToggle={enabled => onChange(formattingToggle(viz, column, type, enabled))}
          onAdvanced={() => setEditing(type)}
        />
      ))}
      {editing && (
        <ConditionalFormattingModal
          type={editing}
          title={`${TYPES.find(item => item.type === editing)?.label} - ${column.name}`}
          initial={formattingOf(viz, column.value, editing) ?? defaultFormatting(editing, column)}
          onSave={config => {
            onChange(formattingSave(column, editing, config));
            setEditing(undefined);
          }}
          onCancel={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
