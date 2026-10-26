export type WidgetId = number;

/**
 * Where a widget sits in its grid, in grid units: 48 columns, rows of the dashboard's cell height. Widgets inside a
 * tab or filter panel widget are placed in that widget's own grid. `row`/`column` of -1 means "not placed yet": v1
 * creates widgets that way and the backend stores it as is.
 *
 * A plain value instead of a deneric2 entity so it can live in React state and be copied with spreads.
 */
export interface Position {
  readonly row: number;
  readonly column: number;
  readonly width: number;
  readonly height: number;
  readonly zIndex: number;
}

export type PositionMap = Readonly<Record<WidgetId, Position>>;

/** Backend `Position` (`widget_positions` values, `widgets/resize` body). */
export interface PositionJson {
  row: number;
  column: number;
  width: number;
  height: number;
  z_index: number;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function positionFromJson(json: unknown): Position {
  const obj = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {};
  return {
    row: toNumber(obj['row'], -1),
    column: toNumber(obj['column'], -1),
    width: toNumber(obj['width'], 1),
    height: toNumber(obj['height'], 1),
    zIndex: toNumber(obj['z_index'], 0)
  };
}

export function positionToJson(position: Position): PositionJson {
  return {
    row: position.row,
    column: position.column,
    width: position.width,
    height: position.height,
    z_index: position.zIndex
  };
}

/** Keys are widget ids sent as strings; keys that are not ids are dropped. */
export function positionsFromJson(json: unknown): Record<WidgetId, Position> {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return {};
  const positions: Record<WidgetId, Position> = {};
  for (const [key, value] of Object.entries(json)) {
    const id = Number(key);
    if (key !== '' && Number.isInteger(id)) positions[id] = positionFromJson(value);
  }
  return positions;
}

export function positionsToJson(positions: PositionMap): Record<string, PositionJson> {
  return Object.fromEntries(Object.entries(positions).map(([id, position]) => [id, positionToJson(position)]));
}

/** Entries with numeric ids, in ascending id order (the order v1 rendered and placed widgets in). */
export function positionEntries(positions: PositionMap): [WidgetId, Position][] {
  return Object.entries(positions)
    .map(([id, position]): [WidgetId, Position] => [Number(id), position])
    .sort((a, b) => a[0] - b[0]);
}

export function isUnplaced(position: Position): boolean {
  return position.row < 0 || position.column < 0;
}

/** Highest z-index, at least 1 (v1 `PositionUtils.getMaxZIndex`). */
export function maxZIndex(positions: PositionMap): number {
  return Object.values(positions).reduce((max, position) => Math.max(max, position.zIndex), 1);
}

/**
 * Shifts z-indexes down so the lowest is 0, keeping their order. Bringing widgets to front only ever increases
 * z-index, so v1 did this before each save to keep the numbers small (`PositionUtils.calculateZIndex`).
 */
export function normalizeZIndex(positions: PositionMap): Record<WidgetId, Position> {
  const values = Object.values(positions);
  const min = values.length ? Math.min(...values.map(position => position.zIndex)) : 0;
  return Object.fromEntries(
    Object.entries(positions).map(([id, position]) => [id, min > 0 ? { ...position, zIndex: position.zIndex - min } : position])
  );
}
