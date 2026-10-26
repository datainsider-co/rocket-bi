import { useCallback, type ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useFieldDnd } from './FieldDndContext';
import { sourceData, targetData, type ZoneId } from './fieldDnd.utils';

export interface FieldItemState {
  /** This item is the one being dragged. */
  dragging: boolean;
  /** A drag hovers this item and dropping would replace it or insert before it. */
  over: boolean;
}

export interface FieldZoneItemProps {
  zoneId: ZoneId;
  /** Stable key of the item, unique in its zone (not the index). */
  itemKey: string;
  index: number;
  disabled?: boolean;
  children: (state: FieldItemState) => ReactNode;
}

/** An item in a zone: draggable to reorder or to another zone, and a drop target itself. */
export function FieldZoneItem({ zoneId, itemKey, index, disabled, children }: FieldZoneItemProps) {
  const target = { kind: 'item', zoneId, index } as const;
  const { canDrop } = useFieldDnd();
  const draggable = useDraggable({
    id: `item:${zoneId}:${itemKey}`,
    data: sourceData({ kind: 'zone', zoneId, index }),
    disabled
  });
  const droppable = useDroppable({ id: `item:${zoneId}:${itemKey}`, data: targetData(target) });
  const { setNodeRef: setDragRef, setActivatorNodeRef } = draggable;
  const { setNodeRef: setDropRef } = droppable;
  // The same node drags, activates (so Space/Enter on a button inside doesn't start a keyboard drag) and receives.
  const ref = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setActivatorNodeRef(node);
      setDropRef(node);
    },
    [setDragRef, setActivatorNodeRef, setDropRef]
  );

  const over = droppable.isOver && !draggable.isDragging && canDrop(target);

  return (
    <div
      ref={ref}
      {...draggable.attributes}
      {...draggable.listeners}
      className={`rounded transition-colors ${over ? 'bg-(--color-brand)/10' : ''} ${draggable.isDragging ? 'opacity-40' : ''}`}
    >
      {children({ dragging: draggable.isDragging, over })}
    </div>
  );
}
