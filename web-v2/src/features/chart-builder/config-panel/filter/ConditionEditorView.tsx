import { DeleteOutlined } from '@ant-design/icons';
import { Button, Radio, Select, Typography } from 'antd';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { FilterInput, type FilterCondition } from '@/core/query/internalFilter';
import { FIELD_NO_DRAG_CLASS } from '@/shared/field-dnd/FieldPointerSensor';
import { FilterValueInput } from '@/shared/filter-input/FilterValueInput';
import { ColumnValuesView } from './ColumnValuesView';
import type { ConditionDraft, ValueMode } from './conditionEditor.utils';
import { ControlValuesInput } from './ControlValuesInput';
import type { ColumnValues } from './useColumnValues';

/** The draft and what changes it (`useConditionEditor`). */
export interface ConditionEditorModel {
  draft: ConditionDraft;
  input: FilterInput;
  conditions: readonly FilterCondition[];
  /** Controls to take values from; none hides the mode switch. */
  controls: readonly ChartControl[];
  columnValues: ColumnValues;
  onCondition: (condition: FilterCondition) => void;
  onMode: (mode: ValueMode, controlId?: number) => void;
  onValues: (values: readonly string[]) => void;
}

interface ConditionEditorViewProps {
  /** The column's name. */
  title: string;
  editor: ConditionEditorModel;
  onApply: () => void;
  onRemove: () => void;
  onCancel: () => void;
}

const MODES = [
  { value: 'manual', label: 'Manual Input' },
  { value: 'control', label: 'Chart Control' }
];

/**
 * Edits a filter condition (v1 `InternalFilterPopover`): the condition, then its values typed in, ticked from the
 * column's values, or taken from a chart control. v1's Range / Selection switch is folded into the condition list.
 */
export function ConditionEditorView({ title, editor, onApply, onRemove, onCancel }: ConditionEditorViewProps) {
  const { draft, input, conditions, controls, columnValues, onCondition, onMode, onValues } = editor;
  const byControl = draft.mode === 'control' && controls.length > 0;
  return (
    // Inside a zone item through the popover's portal: pressing here must not drag the item.
    <div className={`${FIELD_NO_DRAG_CLASS} flex w-80 flex-col gap-3`}>
      <Typography.Text strong>Filter {title}</Typography.Text>
      {conditions.length === 0 ? (
        <Typography.Text type="secondary">This field can&apos;t be filtered here.</Typography.Text>
      ) : (
        <>
          <Select aria-label="Condition" value={draft.condition} options={conditions.map(value => ({ value, label: value }))} onChange={onCondition} />
          {controls.length > 0 && <Radio.Group aria-label="Values from" value={byControl ? 'control' : 'manual'} options={MODES} onChange={event => onMode(event.target.value as ValueMode)} />}
          {byControl ? (
            <ControlValuesInput controls={controls} controlId={draft.controlId} input={input} values={draft.values} onControl={id => onMode('control', id)} onValues={onValues} />
          ) : input === FilterInput.MultiSelect ? (
            <ColumnValuesView source={columnValues} picked={draft.values} onChange={onValues} />
          ) : (
            <FilterValueInput input={input} values={draft.values} onChange={onValues} />
          )}
        </>
      )}
      <div className="flex items-center gap-2">
        <Button type="text" danger icon={<DeleteOutlined />} aria-label="Remove filter" onClick={onRemove} />
        <Button className="ml-auto" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" disabled={conditions.length === 0} onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}
