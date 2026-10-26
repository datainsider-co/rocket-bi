import { createContext, use } from 'react';
import type { DragSource, DropTarget, ZoneId, ZoneRules } from './fieldDnd.utils';

export interface FieldDndState {
  zones: ZoneRules;
  /** What is being dragged, if anything. */
  active: DragSource | undefined;
  /** Whether dropping the active source on `target` would do something. */
  canDrop: (target: DropTarget) => boolean;
  /** Whether the zone should show as a drop area for the active source. */
  canAccept: (zoneId: ZoneId) => boolean;
}

export const FieldDndContext = createContext<FieldDndState | null>(null);

export function useFieldDnd(): FieldDndState {
  const state = use(FieldDndContext);
  if (!state) throw new Error('useFieldDnd must be used inside <FieldDndProvider>');
  return state;
}
