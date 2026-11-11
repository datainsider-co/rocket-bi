import { useState, type ReactNode } from 'react';
import { Dropdown, Popover } from 'antd';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import { FIELD_NO_DRAG_CLASS } from '@/shared/field-dnd/FieldPointerSensor';
import type { TableNode } from '../../field-tree/fieldTree.utils';
import type { DroppedField } from '../../state/builderState.utils';
import { filterableField } from '../fieldMenu.utils';
import { FieldMenuView } from '../FieldMenuView';
import '../ConfigPanel.css';

/** v1 `FilterItem` `maxChipShowing`. */
const MAX_CHIPS = 3;

interface ConditionItemViewProps {
  condition: ConditionData;
  /** What it shows of its values (`conditionChips`). */
  chips: readonly string[];
  /** Tables to pick another field from by clicking the name (v1 `ChangeFieldButton`). */
  tables: readonly TableNode[];
  onPickField: (field: DroppedField) => void;
  /** The editor in the popover; `close` closes it. */
  renderEditor: (close: () => void) => ReactNode;
  onRemove: () => void;
}

/** A condition of the Filters zone (v1 `FilterItem`): its column, condition and values, edited in a popover. */
export function ConditionItemView({ condition, chips, tables, onPickField, renderEditor, onRemove }: ConditionItemViewProps) {
  const [editing, setEditing] = useState(false);
  const name = condition.columnName ?? '';
  const hidden = chips.length - MAX_CHIPS;
  const close = () => setEditing(false);

  return (
    <div className="condition-item">
      <FieldMenuView tables={tables} accepts={filterableField} onPick={onPickField}>
        <button type="button" aria-label={`Change field of filter ${name}`} className="zone-item__name">
          {name}
        </button>
      </FieldMenuView>
      <Popover open={editing} onOpenChange={setEditing} trigger="click" placement="top" destroyOnHidden classNames={{ root: 'condition-popover' }} content={() => renderEditor(close)}>
        <button type="button" aria-label={`Edit filter ${name}`} className="condition-item__body">
          <span className="condition-item__type">{condition.subType}</span>
          {chips.length === 0 ? (
            <span className="condition-item__empty">Click to filter</span>
          ) : (
            chips.slice(0, MAX_CHIPS).map((chip, index) => (
              <span key={`${index}-${chip}`} className="condition-chip" title={chip}>
                {chip}
              </span>
            ))
          )}
          {hidden > 0 && <span className="condition-chip">+{hidden}</span>}
        </button>
      </Popover>
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            { key: 'config', label: 'Config' },
            { key: 'remove', label: 'Remove' }
          ],
          onClick: ({ key }) => (key === 'config' ? setEditing(true) : onRemove())
        }}
      >
        <button type="button" className={`zone-more zone-more--pinned ${FIELD_NO_DRAG_CLASS}`} aria-label={`More actions for filter ${name}`}>
          <i className="di-icon-three-dot" aria-hidden />
        </button>
      </Dropdown>
    </div>
  );
}
