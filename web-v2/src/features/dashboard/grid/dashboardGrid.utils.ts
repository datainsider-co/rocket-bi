import type { Layout, LayoutItem } from 'react-grid-layout';
import { isUnplaced, positionEntries, type Position, type PositionMap, type WidgetId } from '@/core/dashboard/Position';

/** v1 dashboards use 48 columns and 32px cells; saved positions are in these units. */
export const GRID_COLUMNS = 48;
export const GRID_CELL_HEIGHT = 32;
/** Gap between widgets: the dashboard uses 10px, grids inside tab and filter panel widgets 0.5rem. */
export const DASHBOARD_MARGIN = 10;
export const NESTED_GRID_MARGIN = 8;
/** v1 switches to the one-column layout below this viewport width (`ChartUtils.isMobile`). */
export const MOBILE_MAX_WIDTH = 767;

export interface GridMetrics {
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}

/**
 * react-grid-layout sizes rows as `rowHeight` plus a margin between them, while gridstack (v1) used a fixed cell
 * pitch with the margin taken out of each item. This keeps v1's pitch so saved dashboards render at the same size:
 * an item of height h is `h * cellHeight - margin` px in both, and half a margin pads the grid's edges.
 */
export function gridMetrics(margin: number, cellHeight = GRID_CELL_HEIGHT): GridMetrics {
  return {
    rowHeight: cellHeight - margin,
    margin: [margin, margin],
    containerPadding: [margin / 2, margin / 2]
  };
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * First cell, scanning row by row from the top left, where a `width` x `height` box fits without touching
 * `occupied` (v1's gridstack `addNode` for widgets created at -1/-1).
 */
export function findFreeSlot(occupied: readonly Rect[], width: number, height: number, cols: number): { row: number; column: number } {
  const w = clamp(width, 1, cols);
  const h = Math.max(height, 1);
  for (let i = 0; ; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    if (x + w > cols) continue;
    const box = { x, y, w, h };
    if (!occupied.some(rect => intersects(box, rect))) return { row: y, column: x };
  }
}

function toRect(position: Position, cols: number): Rect {
  const w = clamp(position.width, 1, cols);
  return { x: clamp(position.column, 0, cols - w), y: Math.max(position.row, 0), w, h: Math.max(position.height, 1) };
}

/**
 * Gives every unplaced position (-1) a free slot, in widget id order. Placed widgets stay where they are. Returns the
 * same object when nothing needs placing.
 *
 * Positions must all belong to one grid: widgets inside a tab are placed among that tab's widgets only.
 */
export function placeUnplaced(positions: PositionMap, cols = GRID_COLUMNS): PositionMap {
  const entries = positionEntries(positions);
  if (!entries.some(([, position]) => isUnplaced(position))) return positions;
  const occupied = entries.filter(([, position]) => !isUnplaced(position)).map(([, position]) => toRect(position, cols));
  const placed: Record<WidgetId, Position> = { ...positions };
  for (const [id, position] of entries) {
    if (!isUnplaced(position)) continue;
    const slot = findFreeSlot(occupied, position.width, position.height, cols);
    const next = { ...position, ...slot };
    placed[id] = next;
    occupied.push(toRect(next, cols));
  }
  return placed;
}

/** Layout for the grid. Sizes are clamped to fit `cols` so a stored position can't overflow the grid. */
export function toLayout(positions: PositionMap, cols = GRID_COLUMNS): LayoutItem[] {
  return positionEntries(placeUnplaced(positions, cols)).map(([id, position]) => {
    const { x, y, w, h } = toRect(position, cols);
    return { i: String(id), x, y, w, h };
  });
}

/**
 * One-column layout for small screens, as gridstack's `column(1)` did in v1: widgets stacked top to bottom in reading
 * order (row, then column), full width, keeping their height.
 */
export function toStackedLayout(positions: PositionMap): LayoutItem[] {
  const ordered = positionEntries(placeUnplaced(positions)).sort(
    ([, a], [, b]) => a.row - b.row || a.column - b.column
  );
  let y = 0;
  return ordered.map(([id, position]) => {
    const h = Math.max(position.height, 1);
    const item = { i: String(id), x: 0, y, w: 1, h };
    y += h;
    return item;
  });
}

/**
 * Positions that `layout` moved or resized, compared with `positions` (z-index kept). Layout items with no position
 * (react-grid-layout's drop placeholder) are ignored.
 */
export function changedPositions(positions: PositionMap, layout: Layout): Record<WidgetId, Position> {
  const changed: Record<WidgetId, Position> = {};
  for (const item of layout) {
    const id = Number(item.i);
    const position = positions[id];
    if (!position) continue;
    if (position.column !== item.x || position.row !== item.y || position.width !== item.w || position.height !== item.h) {
      changed[id] = { ...position, row: item.y, column: item.x, width: item.w, height: item.h };
    }
  }
  return changed;
}

/**
 * The position that puts widget `id` above every other widget, or undefined when it is already on top or unknown.
 * v1 always added 1, so z-indexes grew on every click.
 */
export function bringToFront(positions: PositionMap, id: WidgetId): Position | undefined {
  const position = positions[id];
  if (!position) return undefined;
  const others = positionEntries(positions).filter(([otherId]) => otherId !== id);
  const top = others.reduce((max, [, other]) => Math.max(max, other.zIndex), Number.NEGATIVE_INFINITY);
  if (position.zIndex > top) return undefined;
  return { ...position, zIndex: top + 1 };
}
