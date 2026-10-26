import { useCallback, type ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { sourceData } from './fieldDnd.utils';

export interface FieldDraggableProps {
  /** Unique among all draggables in the provider, e.g. `column:<db>.<table>.<column>`. */
  id: string;
  /** Handed back in `DragSource.payload` on drop. */
  payload: unknown;
  disabled?: boolean;
  children: ReactNode;
}

/** Something outside the zones that can be dropped into them, like a column in the database tree. */
export function FieldDraggable({ id, payload, disabled, children }: FieldDraggableProps) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `external:${id}`,
    data: sourceData({ kind: 'external', payload }),
    disabled
  });

  // Also the activator, so Space/Enter on a button inside doesn't start a keyboard drag.
  const ref = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node);
      setActivatorNodeRef(node);
    },
    [setNodeRef, setActivatorNodeRef]
  );

  return (
    <div ref={ref} {...attributes} {...listeners} className={isDragging ? 'opacity-50' : undefined}>
      {children}
    </div>
  );
}
