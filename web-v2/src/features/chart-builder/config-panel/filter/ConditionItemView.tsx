import { useState, type ReactNode } from 'react';
import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Popover, Tag } from 'antd';
import type { ConditionData } from '@/core/chart-builder/ConditionData';

/** v1 `FilterItem` `maxChipShowing`. */
const MAX_CHIPS = 3;

interface ConditionItemViewProps {
  condition: ConditionData;
  /** What it shows of its values (`conditionChips`). */
  chips: readonly string[];
  /** The editor in the popover; `close` closes it. */
  renderEditor: (close: () => void) => ReactNode;
  onRemove: () => void;
}

/** A condition of the Filters zone (v1 `FilterItem`): its column, condition and values, edited in a popover. */
export function ConditionItemView({ condition, chips, renderEditor, onRemove }: ConditionItemViewProps) {
  const [editing, setEditing] = useState(false);
  const name = condition.columnName ?? '';
  const hidden = chips.length - MAX_CHIPS;
  const close = () => setEditing(false);

  return (
    <div className="flex items-start gap-1 rounded py-1 pr-1 pl-2">
      <Popover open={editing} onOpenChange={setEditing} trigger="click" placement="right" destroyOnHidden content={() => renderEditor(close)}>
        <button type="button" aria-label={`Edit filter ${name}`} className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-1 border-0 bg-transparent p-0 text-left text-inherit">
          <span className="font-semibold underline">{name}</span>
          <span className="whitespace-nowrap text-black/45">{condition.subType}</span>
          {chips.length === 0 ? (
            <span className="whitespace-nowrap text-black/45">Click to filter</span>
          ) : (
            chips.slice(0, MAX_CHIPS).map((chip, index) => (
              <Tag key={`${index}-${chip}`} className="m-0!">
                {chip}
              </Tag>
            ))
          )}
          {hidden > 0 && <Tag className="m-0!">+{hidden}</Tag>}
        </button>
      </Popover>
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            { key: 'config', label: 'Config' },
            { key: 'remove', label: 'Remove', danger: true }
          ],
          onClick: ({ key }) => (key === 'config' ? setEditing(true) : onRemove())
        }}
      >
        <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`More actions for filter ${name}`} />
      </Dropdown>
    </div>
  );
}
