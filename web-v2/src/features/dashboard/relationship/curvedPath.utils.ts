import type { Point } from './relationship.utils';

/** Width of a table node; lines leave and enter at its sides. */
export const TABLE_NODE_WIDTH = 209;

interface Bezier {
  readonly start: Point;
  readonly control1: Point;
  readonly control2: Point;
  readonly end: Point;
}

/**
 * v1's `CurvedConnector`: `from` and `to` are the centres of the two column rows. A target far to one side gets an
 * S-curve between the facing sides; a target that overlaps horizontally gets a loop out of the same side. With
 * `toPointer`, `to` is the mouse while the user drags a new connection, and the line ends there.
 */
export function curvedBezier(from: Point, to: Point, width: number, toPointer = false): Bezier {
  const half = width / 2;
  const endInset = toPointer ? 0 : half;
  const midY = (from.y + to.y) / 2;
  const midX = (from.x + to.x) / 2;

  if (from.x >= to.x) {
    const start = { x: from.x - half, y: from.y };
    if (from.x - to.x < 1.5 * width) {
      const end = { x: to.x - endInset, y: to.y };
      return { start, control1: { x: to.x - width, y: midY }, control2: end, end };
    }
    const end = { x: to.x + endInset, y: to.y };
    return { start, control1: { x: midX, y: from.y }, control2: { x: midX, y: to.y }, end };
  }

  const start = { x: from.x + half, y: from.y };
  if (to.x - from.x < 1.5 * width) {
    const end = { x: to.x + endInset, y: to.y };
    return { start, control1: { x: to.x + width, y: midY }, control2: end, end };
  }
  const end = { x: to.x - endInset, y: to.y };
  return { start, control1: { x: midX, y: from.y }, control2: { x: midX, y: to.y }, end };
}

export function bezierPath({ start, control1, control2, end }: Bezier): string {
  return `M${start.x},${start.y} C${control1.x},${control1.y} ${control2.x},${control2.y} ${end.x},${end.y}`;
}

/**
 * Centre of a column row from the point React Flow reports for its handle. Each row's handle covers the whole row
 * and sits on the left, so React Flow reports the row's left edge at mid height.
 */
export function rowCenter(handlePoint: Point, width: number): Point {
  return { x: handlePoint.x + width / 2, y: handlePoint.y };
}
