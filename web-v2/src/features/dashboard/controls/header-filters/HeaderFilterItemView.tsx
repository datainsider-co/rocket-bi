import { useState } from 'react';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Popover, Tag } from 'antd';
import type { InternalFilter } from '@/core/query/internalFilter';
import { FilterEditorView } from './FilterEditorView';
import { filterChips, withoutChip } from './headerFilters.utils';

/** v1 `InternalFilterPanel.maxChipShowing`. */
const MAX_CHIPS = 3;

interface HeaderFilterItemViewProps {
  filter: InternalFilter;
  onChange: (filter: InternalFilter) => void;
  onRemove: () => void;
}

/**
 * One header filter (v1 `InternalFilterPanel`): its name, condition and values, a popover to edit it and an eye to
 * turn it off without removing it.
 */
export function HeaderFilterItemView({ filter, onChange, onRemove }: HeaderFilterItemViewProps) {
  const [editing, setEditing] = useState(false);
  const chips = filterChips(filter);
  const hidden = chips.length - MAX_CHIPS;

  const editor = editing && (
    <FilterEditorView
      filter={filter}
      onApply={next => {
        onChange(next);
        setEditing(false);
      }}
      onRemove={() => {
        setEditing(false);
        onRemove();
      }}
      onCancel={() => setEditing(false)}
    />
  );

  return (
    <div className="header-filter flex items-center gap-1 rounded-md py-1 pr-1 pl-2" data-enabled={filter.enabled}>
      <Popover open={editing} onOpenChange={setEditing} trigger="click" placement="bottomLeft" content={editor} destroyOnHidden>
        <button type="button" className="flex min-w-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-inherit" aria-label={`Edit filter ${filter.name}`}>
          <span className="font-medium whitespace-nowrap">{filter.name}</span>
          <span className="whitespace-nowrap opacity-60">{filter.condition}</span>
          {chips.length === 0 ? (
            <span className="whitespace-nowrap opacity-60">Click to filter</span>
          ) : (
            chips.slice(0, MAX_CHIPS).map((chip, index) => (
              <Tag
                key={`${index}-${chip}`}
                className="m-0!"
                closable
                onClose={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange(withoutChip(filter, index));
                }}
              >
                {chip}
              </Tag>
            ))
          )}
          {hidden > 0 && <Tag className="m-0!">+{hidden}</Tag>}
        </button>
      </Popover>
      <Button
        type="text"
        size="small"
        icon={filter.enabled ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        aria-label={filter.enabled ? `Turn off ${filter.name}` : `Turn on ${filter.name}`}
        onClick={() => onChange({ ...filter, enabled: !filter.enabled })}
      />
    </div>
  );
}
