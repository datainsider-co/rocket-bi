import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import type { FieldDndState } from './FieldDndContext';
import { FieldPointerSensor } from './FieldPointerSensor';
import {
  canAcceptIn,
  pickTarget,
  readSource,
  readTarget,
  resolveDrop,
  type DragSource,
  type DropAction,
  type TransferModeOf,
  type ZoneRules,
  type TargetCandidate
} from './fieldDnd.utils';

export interface FieldDndOptions {
  zones: ZoneRules;
  transferModeOf?: TransferModeOf;
  onDrop: (action: DropAction, source: DragSource) => void;
}

/** Pointer moves this far before a drag starts, so clicks on an item (its menus, its name) still work. */
const DRAG_DISTANCE = 4;

/**
 * Picks one target among the droppables under the pointer (see `pickTarget`). The keyboard sensor has no pointer,
 * so it falls back to rect overlap.
 */
export const fieldCollision: CollisionDetection = args => {
  const hits = pointerWithin(args);
  const collisions = hits.length > 0 ? hits : rectIntersection(args);
  const candidates: (TargetCandidate & { id: (typeof collisions)[number]['id'] })[] = [];
  for (const collision of collisions) {
    const container = args.droppableContainers.find(droppable => droppable.id === collision.id);
    const target = readTarget(container?.data.current);
    const rect = args.droppableRects.get(collision.id);
    if (target && rect) candidates.push({ id: collision.id, target, area: rect.width * rect.height });
  }
  const best = pickTarget(candidates);
  const winner = candidates.find(candidate => candidate.target === best);
  return winner ? collisions.filter(collision => collision.id === winner.id) : [];
};

export function useFieldDndHandlers({ zones, transferModeOf, onDrop }: FieldDndOptions) {
  const [active, setActive] = useState<DragSource>();

  const sensors = useSensors(
    useSensor(FieldPointerSensor, { activationConstraint: { distance: DRAG_DISTANCE } }),
    useSensor(KeyboardSensor)
  );

  const onDragStart = useCallback((event: DragStartEvent) => setActive(readSource(event.active.data.current)), []);

  const onDragCancel = useCallback(() => setActive(undefined), []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActive(undefined);
      const source = readSource(event.active.data.current);
      const target = readTarget(event.over?.data.current);
      if (!source || !target) return;
      const action = resolveDrop(source, target, zones, transferModeOf);
      if (action) onDrop(action, source);
    },
    [zones, transferModeOf, onDrop]
  );

  const state = useMemo<FieldDndState>(
    () => ({
      zones,
      active,
      canDrop: target => !!active && resolveDrop(active, target, zones, transferModeOf) !== null,
      canAccept: zoneId => !!active && canAcceptIn(active, zoneId, zones)
    }),
    [active, zones, transferModeOf]
  );

  return { state, sensors, onDragStart, onDragCancel, onDragEnd };
}
