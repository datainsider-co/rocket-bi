import type { Point } from '@/shared/relationship/relationship.utils';

/** Shown over the empty canvas. */
export const EMPTY_CANVAS_HINT = 'Drag tables from the database tree and drop them here';

/** v1 put a dropped table 40px left of the pointer, so the pointer lands on its name rather than its corner. */
const DROP_OFFSET_X = 40;

/** Where a table dropped at `point` (canvas coordinates, from `screenToFlowPosition`) goes. */
export function dropPosition(point: Point): Point {
  return { x: point.x - DROP_OFFSET_X, y: point.y };
}

export function alreadyOnCanvasMessage(tblName: string): string {
  return `${tblName} is already on the canvas`;
}

