import { useDroppable } from '@dnd-kit/core';
import { useFieldDnd } from './FieldDndContext';
import { targetData, type ZoneId } from './fieldDnd.utils';
import './FieldDnd.css';

/**
 * The line above item `index` (v1 `DropItem` divider). Its hit area is taller than the line and overlaps the items
 * around it, so dropping near the edge of an item inserts instead of landing on the item. Collisions use rects, so
 * it takes no pointer events and never blocks clicks on the items.
 */
export function FieldDropGap({ zoneId, index }: { zoneId: ZoneId; index: number }) {
  const target = { kind: 'gap', zoneId, index } as const;
  const { canDrop } = useFieldDnd();
  const { setNodeRef, isOver } = useDroppable({ id: `gap:${zoneId}:${index}`, data: targetData(target) });
  const highlighted = isOver && canDrop(target);

  return (
    <div ref={setNodeRef} className={`field-zone__gap${highlighted ? ' field-zone__gap--over' : ''}`} aria-hidden>
      <div className="field-zone__gap-line" />
    </div>
  );
}
