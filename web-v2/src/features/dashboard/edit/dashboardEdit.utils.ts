import type { Dashboard } from '@/core/dashboard/Dashboard';
import { normalizeZIndex, type Position, type PositionMap, type WidgetId } from '@/core/dashboard/Position';
import { nestedWidgetIds, widgetFromJson, type Widget } from '@/core/dashboard/Widget';
import { tabItemsToJson } from '@/core/dashboard/widgetJson';
import { asRecord, isRecord, type JsonObject } from '@/core/json/json';
import { placeUnplaced } from '../grid/dashboardGrid.utils';

/** The dashboard with `widget` added, or replacing the one with its id; `position` too when given. */
export function withWidget(dashboard: Dashboard, widget: Widget, position?: Position): Dashboard {
  const exists = dashboard.widgets.some(item => item.id === widget.id);
  return {
    ...dashboard,
    widgets: exists ? dashboard.widgets.map(item => (item.id === widget.id ? widget : item)) : [...dashboard.widgets, widget],
    positions: position ? { ...dashboard.positions, [widget.id]: position } : dashboard.positions
  };
}

/** The tab widgets holding `id`, with it taken out (v1 `handleRemoveWidgetInTabs`): what to save after deleting it. */
export function tabsWithout(dashboard: Dashboard, id: WidgetId): Widget[] {
  return dashboard.widgets.flatMap(widget => {
    if ((widget.kind !== 'tab' && widget.kind !== 'filter_panel') || !widget.tabItems.some(tab => tab.widgetIds.includes(id))) return [];
    const tabItems = widget.tabItems.map(tab => ({ ...tab, widgetIds: tab.widgetIds.filter(child => child !== id) }));
    return [widgetFromJson({ ...widget.json, tab_items: tabItemsToJson(tabItems) })];
  });
}

/** The dashboard without the widget, its position, and its place in any tab. */
export function withoutWidget(dashboard: Dashboard, id: WidgetId): Dashboard {
  const { [id]: _removed, ...positions } = dashboard.positions;
  const tabs = new Map(tabsWithout(dashboard, id).map(tab => [tab.id, tab]));
  return {
    ...dashboard,
    widgets: dashboard.widgets.filter(widget => widget.id !== id).map(widget => tabs.get(widget.id) ?? widget),
    positions
  };
}

/** The positions shown while editing: the stored ones with the unsaved moves on top, for widgets that still exist. */
export function editedPositions(dashboard: Dashboard, moves: PositionMap): Record<WidgetId, Position> {
  const positions: Record<WidgetId, Position> = {};
  for (const widget of dashboard.widgets) {
    const position = moves[widget.id] ?? dashboard.positions[widget.id];
    if (position) positions[widget.id] = position;
  }
  return positions;
}

/**
 * What `widgets/resize` gets on Save: one position per widget, each grid (the dashboard, every tab) with its unplaced
 * widgets given a free slot, z-indexes from 0 (v1 `saveWidgetPosition`).
 */
export function layoutToSave(dashboard: Dashboard, moves: PositionMap): Record<WidgetId, Position> {
  const positions = editedPositions(dashboard, moves);
  const grids: WidgetId[][] = dashboard.widgets.flatMap(widget => (widget.kind === 'tab' || widget.kind === 'filter_panel' ? widget.tabItems.map(tab => [...tab.widgetIds]) : []));
  const nested = nestedWidgetIds(dashboard.widgets);
  grids.push(dashboard.widgets.map(widget => widget.id).filter(id => !nested.has(id)));
  const placed: Record<WidgetId, Position> = {};
  for (const ids of grids) {
    const grid = Object.fromEntries(ids.flatMap(id => (positions[id] ? [[id, positions[id]]] : [])));
    Object.assign(placed, placeUnplaced(grid));
  }
  return normalizeZIndex(placed);
}

/** Where a copy goes: same size, a free slot found by the grid. */
export function copyPosition(position: Position | undefined, fallback: Position): Position {
  return { ...(position ?? fallback), row: -1, column: -1 };
}

/** v1 `CopiedDataType`: charts and the other widgets were told apart. */
type CopiedType = 'chart' | 'widget';

/**
 * Clipboard text for a copied widget, in v1's `CopiedData` envelope. Its `transferData` holds the widget as the server
 * stores it (`format: server`): v1 put its own camelCase objects there, which only v1's key renaming could read.
 */
export function copiedText(widget: Widget, position: Position | undefined, sourceUrl: string): string {
  const type: CopiedType = widget.kind === 'chart' ? 'chart' : 'widget';
  const transferData = JSON.stringify({ format: 'server', widget: widget.json, ...(position && { position: { width: position.width, height: position.height } }) });
  return JSON.stringify({ type, sourceUrl, transferData });
}

export interface PastedWidget {
  json: JsonObject;
  size?: { width: number; height: number };
}

/** The widget in clipboard text, or why it can't be pasted (v1 `CopiedData.isSameOrigin` and friends). */
export function pastedWidget(text: string, origin: string): PastedWidget | { error: string } {
  let envelope: unknown;
  try {
    envelope = JSON.parse(text);
  } catch {
    return { error: 'Nothing to paste: copy a widget first' };
  }
  if (!isRecord(envelope) || typeof envelope['transferData'] !== 'string' || typeof envelope['sourceUrl'] !== 'string') {
    return { error: 'Nothing to paste: copy a widget first' };
  }
  try {
    if (new URL(envelope['sourceUrl']).origin !== origin) return { error: 'Incompatible this chart data' };
    const data = asRecord(JSON.parse(envelope['transferData']));
    if (data['format'] !== 'server' || !isRecord(data['widget'])) return { error: 'This widget was copied from the old app; copy it again here' };
    const size = asRecord(data['position']);
    const width = size['width'];
    const height = size['height'];
    return { json: data['widget'], ...(typeof width === 'number' && typeof height === 'number' && { size: { width, height } }) };
  } catch {
    return { error: 'Incompatible this chart data' };
  }
}

export function isPasteError(value: PastedWidget | { error: string }): value is { error: string } {
  return 'error' in value;
}
