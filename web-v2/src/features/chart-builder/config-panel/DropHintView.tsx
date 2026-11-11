import type { TableNode } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';
import type { FieldFilter } from './fieldMenu.utils';
import { FieldMenuView } from './FieldMenuView';
import './ConfigPanel.css';

interface DropHintViewProps {
  tables: readonly TableNode[];
  accepts?: FieldFilter;
  onPick: (field: DroppedField) => void;
}

/** v1 `DraggableConfig.placeholder` and its "click here" menu, shown while a zone can take more fields. */
export function DropHintView({ tables, accepts, onPick }: DropHintViewProps) {
  return (
    <div className="drop-hint">
      <img src="/icons/ic-drag.svg" alt="" />
      Drag and drop your fields or{' '}
      <FieldMenuView tables={tables} accepts={accepts} onPick={onPick}>
        <button type="button" className="drop-hint__link">
          click here
        </button>
      </FieldMenuView>
    </div>
  );
}
