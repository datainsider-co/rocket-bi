import type { ReactNode } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { FieldDndContext } from './FieldDndContext';
import type { DragSource } from './fieldDnd.utils';
import { fieldCollision, useFieldDndHandlers, type FieldDndOptions } from './useFieldDndHandlers';

const OVERLAY_Z_INDEX = 2000;

export interface FieldDndProviderProps extends FieldDndOptions {
  /** What follows the pointer while dragging (v1's drag image: icon and field name). */
  renderOverlay: (source: DragSource) => ReactNode;
  children: ReactNode;
}

/**
 * Wraps everything fields can be dragged between: the field tree and the drop zones. On drop it resolves the rules
 * (`resolveDrop`) and calls `onDrop` with what to do; apply it with `applyDrop` or by hand.
 *
 * `zones` must describe every `FieldDropZone` inside, with current sizes. Memoize it and `transferModeOf`.
 */
export function FieldDndProvider({ renderOverlay, children, ...options }: FieldDndProviderProps) {
  const { state, sensors, onDragStart, onDragCancel, onDragEnd } = useFieldDndHandlers(options);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={fieldCollision}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <FieldDndContext value={state}>
        {children}
        {/*
          No drop animation: it would fly the overlay back to where the drag started, even after a drop. Above antd's
          modals (1000) and popups (1050): dnd-kit's default (999) hid it under the ChartBuilder modal.
        */}
        <DragOverlay dropAnimation={null} zIndex={OVERLAY_Z_INDEX}>
          {state.active ? renderOverlay(state.active) : null}
        </DragOverlay>
      </FieldDndContext>
    </DndContext>
  );
}
