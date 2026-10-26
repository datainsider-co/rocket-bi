import type { PointerEvent as ReactPointerEvent } from 'react';
import { PointerSensor, type PointerSensorOptions } from '@dnd-kit/core';

/** Add this class to anything inside a draggable that must not start a drag. */
export const FIELD_NO_DRAG_CLASS = 'field-dnd-no-drag';

const NO_DRAG = `input, textarea, select, [contenteditable=""], [contenteditable="true"], .${FIELD_NO_DRAG_CLASS}`;

/** Whether pressing on `target` may start a drag: not inside a text field or a `FIELD_NO_DRAG_CLASS` element. */
export function canStartDragFrom(target: EventTarget | null): boolean {
  return !(target instanceof Element && target.closest(NO_DRAG));
}

/**
 * dnd-kit's pointer sensor, except a press inside a text field selects text instead of dragging the item around it
 * (v1 relied on the native drag API, which behaves that way).
 */
export class FieldPointerSensor extends PointerSensor {
  static override activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: ReactPointerEvent, { onActivation }: PointerSensorOptions) => {
        if (!event.isPrimary || event.button !== 0 || !canStartDragFrom(event.target)) return false;
        onActivation?.({ event });
        return true;
      }
    }
  ];
}
