import { useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
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
 * turn it off without removing it. Off, only the eye still answers, as in v1.
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
    <div className="header-filter" data-enabled={filter.enabled}>
      {/* Any click in the group opens the editor (v1 `showPopover` on the chips too), but a chip's x. */}
      <Popover open={editing} onOpenChange={setEditing} trigger="click" placement="bottomLeft" content={editor} destroyOnHidden>
        <div className="header-filter__display">
          <button type="button" className="header-filter__edit" disabled={!filter.enabled} aria-label={`Edit filter ${filter.name}`}>
            <span>{filter.name}</span>
            <span className="header-filter__condition">{filter.condition}</span>
            {chips.length === 0 && <span className="header-filter__empty">Click to filter</span>}
          </button>
          {chips.slice(0, MAX_CHIPS).map((chip, index) => (
            <span key={`${index}-${chip}`} className="header-filter__chip">
              <span className="header-filter__chip-title" title={chip}>
                {chip}
              </span>
              <button
                type="button"
                className="header-filter__chip-remove"
                disabled={!filter.enabled}
                aria-label={`Remove ${chip} from ${filter.name}`}
                onClick={event => {
                  event.stopPropagation();
                  onChange(withoutChip(filter, index));
                }}
              >
                <CloseOutlined />
              </button>
            </span>
          ))}
          {hidden > 0 && (
            <span className="header-filter__chip">
              <span className="header-filter__chip-title">+{hidden}</span>
            </span>
          )}
        </div>
      </Popover>
      <button
        type="button"
        className="header-filter__eye"
        aria-label={filter.enabled ? `Turn off ${filter.name}` : `Turn on ${filter.name}`}
        onClick={() => onChange({ ...filter, enabled: !filter.enabled })}
      >
        <i className={filter.enabled ? 'di-icon-eye' : 'di-icon-eye-close'} aria-hidden />
      </button>
    </div>
  );
}
