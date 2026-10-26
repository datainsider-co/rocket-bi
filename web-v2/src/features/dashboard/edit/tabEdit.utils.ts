import type { MenuProps } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import { nestedWidgetIds, type TabItem, type TabWidget, type Widget } from '@/core/dashboard/Widget';
import { tabItemsToJson } from '@/core/dashboard/widgetJson';
import { asRecord, asString, getPath, type JsonObject } from '@/core/json/json';
import type { DashboardPermissions } from '../access/access.utils';
import { isFilterVizClass } from '../charts/vizClass';
import type { TabHeaderStyle } from '../widgets/tab/tabWidget.utils';

type MenuItems = NonNullable<MenuProps['items']>;

/** A tab widget's JSON with other tabs (v1 `TabWidget.addTab`, `removeTab`, `Tab.addWidgets`, ...). */
function withTabs(widget: TabWidget, tabItems: readonly TabItem[]): JsonObject {
  return { ...widget.json, tab_items: tabItemsToJson(tabItems) };
}

export function withTabAdded(widget: TabWidget, name: string): JsonObject {
  return withTabs(widget, [...widget.tabItems, { name, widgetIds: [], options: {} }]);
}

export function withTabRenamed(widget: TabWidget, index: number, name: string): JsonObject {
  return withTabs(
    widget,
    widget.tabItems.map((tab, at) => (at === index ? { ...tab, name } : tab))
  );
}

/** Without the tab; its widgets go back to the dashboard (v1 left them where they were in the tab). */
export function withTabRemoved(widget: TabWidget, index: number): { json: JsonObject; released: WidgetId[] } {
  return {
    json: withTabs(
      widget,
      widget.tabItems.filter((_tab, at) => at !== index)
    ),
    released: [...(widget.tabItems[index]?.widgetIds ?? [])]
  };
}

export function withWidgetsAdded(widget: TabWidget, index: number, ids: readonly WidgetId[]): JsonObject {
  return withTabs(
    widget,
    widget.tabItems.map((tab, at) => (at === index ? { ...tab, widgetIds: [...tab.widgetIds, ...ids.filter(id => !tab.widgetIds.includes(id))] } : tab))
  );
}

export function withWidgetsRemoved(widget: TabWidget, index: number, ids: readonly WidgetId[]): JsonObject {
  return withTabs(
    widget,
    widget.tabItems.map((tab, at) => (at === index ? { ...tab, widgetIds: tab.widgetIds.filter(id => !ids.includes(id)) } : tab))
  );
}

/** The tabs in a new order, given as their current indexes (v1 `SortModal`). */
export function withTabsOrdered(widget: TabWidget, order: readonly number[]): JsonObject {
  return withTabs(
    widget,
    order.flatMap(index => widget.tabItems[index] ?? [])
  );
}

/** `order` with the entry at `index` moved one step towards `step` (-1 up, 1 down). */
export function moveInOrder(order: readonly number[], index: number, step: -1 | 1): number[] {
  const target = index + step;
  if (target < 0 || target >= order.length) return [...order];
  const next = [...order];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/**
 * What can go into a tab (v1 `widgetInDashboard`): widgets on the dashboard itself, not other tabs. A filter panel
 * takes filters only (v1 `FilterableSetting`).
 */
export function widgetsToAdd(dashboard: Dashboard, target: TabWidget): Widget[] {
  const nested = nestedWidgetIds(dashboard.widgets);
  return dashboard.widgets.filter(widget => {
    if (nested.has(widget.id) || widget.id === target.id || widget.kind === 'tab' || widget.kind === 'filter_panel') return false;
    return target.kind !== 'filter_panel' || (widget.kind === 'chart' && isFilterVizClass(asString(getPath(widget.setting, ['options', 'class_name']))));
  });
}

/** The widgets of one tab, in its order. */
export function widgetsOfTab(dashboard: Dashboard, target: TabWidget, index: number): Widget[] {
  const byId = new Map(dashboard.widgets.map(widget => [widget.id, widget]));
  return (target.tabItems[index]?.widgetIds ?? []).flatMap(id => byId.get(id) ?? []);
}

/** A widget's name in a list; charts without a title show their type. */
export function widgetLabel(widget: Widget): string {
  if (widget.name) return widget.name;
  if (widget.kind === 'text') return widget.content.replace(/<[^>]+>/g, '').slice(0, 40) || 'Text';
  return widget.kind === 'chart' ? 'Untitled chart' : widget.kind === 'image' ? 'Image' : 'Widget';
}

/** What a tab widget's menu can do in edit mode. */
export interface TabEditHandlers {
  addTab: (widget: TabWidget) => void;
  renameTab: (widget: TabWidget, index: number) => void;
  addWidgets: (widget: TabWidget, index: number) => void;
  removeWidgets: (widget: TabWidget, index: number) => void;
  deleteTab: (widget: TabWidget, index: number) => void;
  sortTabs: (widget: TabWidget) => void;
  configTab: (widget: TabWidget) => void;
  remove: (widget: Widget) => void;
}

/**
 * A tab widget's menu (v1 `TabViewer.widgetConfigOptions` + its tab menu, for the open tab) or a filter panel's (v1
 * `FilterPanelViewer`, whose one tab holds the filters).
 */
export function tabEditMenuItems(widget: TabWidget, index: number, permissions: DashboardPermissions, handlers: TabEditHandlers): MenuItems {
  const { canEdit, canDelete } = permissions;
  const item = (key: string, label: string, onClick: () => void, enabled = canEdit) => ({ key, label, onClick, disabled: !enabled });
  const remove = item('delete', 'Delete widget', () => handlers.remove(widget), canDelete);
  if (widget.kind === 'filter_panel') {
    return [
      item('rename-tab', 'Edit title', () => handlers.renameTab(widget, 0)),
      item('add-widgets', 'Add filter', () => handlers.addWidgets(widget, 0)),
      item('remove-widgets', 'Remove filter', () => handlers.removeWidgets(widget, 0), canEdit && (widget.tabItems[0]?.widgetIds.length ?? 0) > 0),
      item('config', 'Config widget', () => handlers.configTab(widget)),
      remove
    ];
  }
  const tab = widget.tabItems[index];
  return [
    item('add-tab', 'Add tab', () => handlers.addTab(widget)),
    item('sort', 'Sort orders', () => handlers.sortTabs(widget), canEdit && widget.tabItems.length > 1),
    item('config', 'Config tab', () => handlers.configTab(widget)),
    ...(tab
      ? [
          { type: 'divider' as const },
          {
            type: 'group' as const,
            label: tab.name || 'This tab',
            children: [
              item('rename-tab', 'Edit title', () => handlers.renameTab(widget, index)),
              item('add-widgets', 'Add chart', () => handlers.addWidgets(widget, index)),
              item('remove-widgets', 'Remove chart', () => handlers.removeWidgets(widget, index), canEdit && tab.widgetIds.length > 0),
              item('delete-tab', 'Delete tab', () => handlers.deleteTab(widget, index))
            ]
          },
          { type: 'divider' as const }
        ]
      : []),
    remove
  ];
}

/** The filter panel's Apply button (v1 `footer.apply`). */
export interface ApplyButtonStyle {
  title: string;
  color: string;
  background: string;
}

export function applyButtonStyleOf(widget: TabWidget): ApplyButtonStyle {
  const apply = asRecord(getPath(widget.json, ['extra_data', 'footer', 'apply']));
  return {
    title: asString(apply['title']) || 'Apply',
    color: asString(apply['color'], 'var(--accent-text-color)'),
    background: asString(apply['background'], 'var(--accent)')
  };
}

/** The widget's JSON with a new header and, for a filter panel, Apply button; other keys stay. */
export function withTabStyle(widget: TabWidget, header: TabHeaderStyle, apply?: ApplyButtonStyle): JsonObject {
  const extraData = asRecord(widget.json['extra_data']);
  const storedHeader = asRecord(extraData['header']);
  const footer = asRecord(extraData['footer']);
  return {
    ...widget.json,
    extra_data: {
      ...extraData,
      header: {
        ...storedHeader,
        position: header.position,
        font_size: header.fontSize,
        color: header.color,
        active: { ...asRecord(storedHeader['active']), background: header.activeBackground },
        in_active: { ...asRecord(storedHeader['in_active']), background: header.inactiveBackground }
      },
      ...(apply && { footer: { ...footer, apply: { ...asRecord(footer['apply']), title: apply.title, color: apply.color, background: apply.background } } })
    }
  };
}
