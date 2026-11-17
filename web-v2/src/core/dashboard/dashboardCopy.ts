import type { DirectoryType } from '@/core/directory/Directory';
import { asArray, asRecord, getPath, type JsonObject } from '@/core/json/json';
import type { Dashboard } from './Dashboard';
import type { DashboardService } from './DashboardService';
import type { WidgetId } from './Position';
import type { Widget } from './Widget';

/**
 * Copying a dashboard or a saved query (v1 `DirectoryListing.duplicateDashboard`): `dashboards/create` with the
 * source's widgets, positions and setting.
 *
 * The server gives every widget of the copy a new id, in no particular order, and moves the positions to the new ids.
 * It does not touch the ids a tab widget or a filter panel keeps of its children (`tab_items[].widget_ids`), so those
 * still name the source's widgets and the copy's tabs come out empty. Each widget is therefore sent with its own id in
 * `extra_data.origin`, which the server stores as it is; the copy's widgets then tell which new id replaced which old
 * one, and the tabs are rewritten with `widgets/{id}/edit`.
 */
const ORIGIN_PATH = ['extra_data', 'origin'] as const;

export interface CopyTarget {
  name: string;
  parentDirectoryId: number;
  /** The source's: a dashboard stays a dashboard, a saved query a saved query. */
  directoryType: DirectoryType;
}

/** v1 named the copy after its source. */
export function copyName(name: string): string {
  return `${name} copy`;
}

function withOrigin(widget: JsonObject): JsonObject {
  return { ...widget, extra_data: { ...asRecord(widget['extra_data']), origin: widget['id'] } };
}

/**
 * The body of `dashboards/create` that copies `source`, a `GET dashboards/{id}` response as the server sent it, so
 * what v2 doesn't model (`boost_info`, the deprecated top level `main_date_filter`) is copied too. A source without a
 * setting gives a copy without one.
 */
export function copyRequest(source: JsonObject, target: CopyTarget): JsonObject {
  return {
    name: target.name,
    parent_directory_id: target.parentDirectoryId,
    directory_type: target.directoryType,
    main_date_filter: source['main_date_filter'],
    widgets: asArray(source['widgets']).map(widget => withOrigin(asRecord(widget))),
    widget_positions: asRecord(source['widget_positions']),
    setting: source['setting'],
    boost_info: source['boost_info']
  };
}

/** The new id of each source widget, from the `extra_data.origin` the copy's widgets carry. */
function newIdsByOrigin(widgets: readonly Widget[]): Map<WidgetId, WidgetId> {
  const ids = new Map<WidgetId, WidgetId>();
  for (const widget of widgets) {
    const origin = getPath(widget.json, ORIGIN_PATH);
    if (typeof origin === 'number') ids.set(origin, widget.id);
  }
  return ids;
}

/**
 * The tab widgets and filter panels of a copy whose children still go by the source's ids, as the JSON to save: the
 * same widget with the new ids. Widgets that name no copied widget are left out, so a second pass finds nothing.
 */
export function tabsWithNewIds(widgets: readonly Widget[]): JsonObject[] {
  const newIds = newIdsByOrigin(widgets);
  const fixed: JsonObject[] = [];
  for (const widget of widgets) {
    if (widget.kind !== 'tab' && widget.kind !== 'filter_panel') continue;
    let changed = false;
    const tabItems = asArray(widget.json['tab_items']).map(value => {
      const item = asRecord(value);
      const widgetIds = asArray(item['widget_ids']).map(id => {
        const newId = typeof id === 'number' ? newIds.get(id) : undefined;
        if (newId === undefined || newId === id) return id;
        changed = true;
        return newId;
      });
      return { ...item, widget_ids: widgetIds };
    });
    if (changed) fixed.push({ ...widget.json, tab_items: tabItems });
  }
  return fixed;
}

/** The copy was created, but some of its tab widgets could not be pointed at their copied children. */
export class CopyTabsError extends Error {
  constructor(readonly dashboard: Dashboard) {
    super(`"${dashboard.name}" was created, but its tabs could not be updated. Please try again.`);
    this.name = 'CopyTabsError';
  }
}

/**
 * Copies the dashboard or saved query `source` into `parentDirectoryId` and answers the copy as the server created
 * it. The tabs are saved one after another: the server rewrites the whole widget list on every edit, so edits sent
 * together would overwrite each other. Throws `CopyTabsError` when the copy exists but a tab could not be saved.
 */
export async function copyDashboard(
  dashboards: Pick<DashboardService, 'getJson' | 'createFrom' | 'editWidget'>,
  source: { dashboardId: number; directoryType: DirectoryType },
  parentDirectoryId: number
): Promise<Dashboard> {
  const json = await dashboards.getJson(source.dashboardId);
  const target = { name: copyName(String(json['name'] ?? '')), parentDirectoryId, directoryType: source.directoryType };
  const created = await dashboards.createFrom(copyRequest(json, target));
  try {
    for (const tab of tabsWithNewIds(created.widgets)) await dashboards.editWidget(created.id, tab);
  } catch {
    throw new CopyTabsError(created);
  }
  return created;
}
