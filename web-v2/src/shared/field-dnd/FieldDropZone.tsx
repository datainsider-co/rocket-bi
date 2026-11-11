import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useFieldDnd } from './FieldDndContext';
import { FieldDropGap } from './FieldDropGap';
import { FieldZoneItem, type FieldItemState } from './FieldZoneItem';
import { targetData, type ZoneId } from './fieldDnd.utils';
import './FieldDnd.css';

export interface FieldDropZoneProps {
  /** Must have a rule in the provider's `zones`; its `disabled` also disables the zone here. */
  zoneId: ZoneId;
  /** Stable keys of the items, in order. Their count must match the zone rule's `size`. */
  itemKeys: readonly string[];
  renderItem: (index: number, state: FieldItemState) => ReactNode;
  /** Shown below the items, e.g. "Drag a field here or click here". */
  placeholder?: ReactNode;
}

/** A list fields are dropped into (v1 `DropArea` + `DropItem`): a grey box, dashed in the accent while a drag could land in it. */
export function FieldDropZone({ zoneId, itemKeys, renderItem, placeholder }: FieldDropZoneProps) {
  const { zones, canAccept, canDrop } = useFieldDnd();
  const disabled = zones[zoneId]?.disabled ?? false;
  const target = { kind: 'zone', zoneId } as const;
  const { setNodeRef, isOver } = useDroppable({ id: `zone:${zoneId}`, data: targetData(target) });
  const accepting = !disabled && canAccept(zoneId);
  const classes = ['field-zone', accepting ? 'field-zone--accepting' : '', accepting && isOver && canDrop(target) ? 'field-zone--over' : '', disabled ? 'field-zone--disabled' : ''];

  return (
    <div ref={setNodeRef} data-zone-id={zoneId} aria-disabled={disabled} className={classes.filter(Boolean).join(' ')}>
      {itemKeys.length > 0 && (
        <div className="field-zone__items">
          {itemKeys.map((key, index) => (
            <div key={key} className="field-zone__entry">
              <FieldDropGap zoneId={zoneId} index={index} />
              <FieldZoneItem zoneId={zoneId} itemKey={key} index={index} disabled={disabled}>
                {state => renderItem(index, state)}
              </FieldZoneItem>
            </div>
          ))}
          <FieldDropGap zoneId={zoneId} index={itemKeys.length} />
        </div>
      )}
      {placeholder && <div className="field-zone__after">{placeholder}</div>}
    </div>
  );
}
