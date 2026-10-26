import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useFieldDnd } from './FieldDndContext';
import { FieldDropGap } from './FieldDropGap';
import { FieldZoneItem, type FieldItemState } from './FieldZoneItem';
import { targetData, type ZoneId } from './fieldDnd.utils';

export interface FieldDropZoneProps {
  /** Must have a rule in the provider's `zones`; its `disabled` also disables the zone here. */
  zoneId: ZoneId;
  /** Stable keys of the items, in order. Their count must match the zone rule's `size`. */
  itemKeys: readonly string[];
  renderItem: (index: number, state: FieldItemState) => ReactNode;
  /** Shown below the items, e.g. "Drag a field here or click here". */
  placeholder?: ReactNode;
}

/** A list fields are dropped into (v1 `DropArea` + `DropItem`). Highlights while a drag could land in it. */
export function FieldDropZone({ zoneId, itemKeys, renderItem, placeholder }: FieldDropZoneProps) {
  const { zones, canAccept, canDrop } = useFieldDnd();
  const disabled = zones[zoneId]?.disabled ?? false;
  const target = { kind: 'zone', zoneId } as const;
  const { setNodeRef, isOver } = useDroppable({ id: `zone:${zoneId}`, data: targetData(target) });
  const accepting = !disabled && canAccept(zoneId);
  const border = !accepting
    ? 'border-solid border-gray-300'
    : isOver && canDrop(target)
      ? 'border-dashed border-(--color-brand) bg-(--color-brand)/5'
      : 'border-dashed border-(--color-brand)';

  return (
    <div
      ref={setNodeRef}
      data-zone-id={zoneId}
      aria-disabled={disabled}
      className={`rounded border-[1.5px] p-2 ${border} ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      {itemKeys.map((key, index) => (
        <div key={key}>
          <FieldDropGap zoneId={zoneId} index={index} />
          <FieldZoneItem zoneId={zoneId} itemKey={key} index={index} disabled={disabled}>
            {state => renderItem(index, state)}
          </FieldZoneItem>
        </div>
      ))}
      {itemKeys.length > 0 && <FieldDropGap zoneId={zoneId} index={itemKeys.length} />}
      {placeholder}
    </div>
  );
}
