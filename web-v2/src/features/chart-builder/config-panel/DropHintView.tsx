import { DragOutlined } from '@ant-design/icons';
import type { TableNode } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';
import type { FieldFilter } from './fieldMenu.utils';
import { FieldMenuView } from './FieldMenuView';

interface DropHintViewProps {
  tables: readonly TableNode[];
  accepts?: FieldFilter;
  onPick: (field: DroppedField) => void;
}

/** v1 `DraggableConfig.placeholder` and its "click here" menu, shown while a zone can take more fields. */
export function DropHintView({ tables, accepts, onPick }: DropHintViewProps) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 text-black/45 select-none">
      <DragOutlined aria-hidden />
      <span>
        Drag and drop your fields or{' '}
        <FieldMenuView tables={tables} accepts={accepts} onPick={onPick}>
          <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-[var(--color-brand)] underline">
            click here
          </button>
        </FieldMenuView>
      </span>
    </div>
  );
}
