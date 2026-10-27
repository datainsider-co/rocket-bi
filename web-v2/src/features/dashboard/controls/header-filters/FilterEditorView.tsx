import { useState } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Select, Typography } from 'antd';
import { familyOf, inputOf, type InternalFilter } from '@/core/query/internalFilter';
import { FilterValueInput } from '@/shared/filter-input/FilterValueInput';
import { appliedFilter, conditionOptions, withCondition } from './headerFilters.utils';

interface FilterEditorViewProps {
  filter: InternalFilter;
  onApply: (filter: InternalFilter) => void;
  onRemove: () => void;
  onCancel: () => void;
}

/**
 * Edits one header filter (v1 `InternalFilterPopover`): a condition and its values, applied together. Mount it per
 * opening so the draft starts from the filter. v1's Range / Selection switch is folded into the condition list.
 */
export function FilterEditorView({ filter, onApply, onRemove, onCancel }: FilterEditorViewProps) {
  const [draft, setDraft] = useState(filter);
  const options = conditionOptions(filter);
  return (
    <div className="flex w-72 flex-col gap-3">
      <Typography.Text strong>Filter {filter.name}</Typography.Text>
      {options.length === 0 ? (
        <Typography.Text type="secondary">This field can't be filtered here.</Typography.Text>
      ) : (
        <>
          <Select aria-label="Condition" value={draft.condition} options={options} onChange={condition => setDraft(withCondition(draft, condition))} />
          <FilterValueInput input={inputOf(familyOf(draft), draft.condition)} values={draft.values} onChange={values => setDraft({ ...draft, values })} />
        </>
      )}
      <div className="flex items-center gap-2">
        <Button type="text" danger icon={<DeleteOutlined />} aria-label="Remove filter" onClick={onRemove} />
        <Button className="ml-auto" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" disabled={options.length === 0} onClick={() => onApply(appliedFilter(draft))}>
          Apply
        </Button>
      </div>
    </div>
  );
}
