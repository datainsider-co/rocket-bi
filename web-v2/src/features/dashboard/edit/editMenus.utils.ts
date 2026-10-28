import type { MenuProps } from 'antd';
import type { ChartWidget, Widget } from '@/core/dashboard/Widget';
import type { DashboardPermissions } from '../access/access.utils';

type MenuItems = NonNullable<MenuProps['items']>;

/** What a widget's menu can do in edit mode. */
export interface WidgetEditHandlers {
  rename: (widget: Widget) => void;
  editText: (widget: Widget) => void;
  replaceImage: (widget: Widget) => void;
  /** Opens ChartBuilder on the chart; absent without ChartBuilder. */
  configChart?: (widget: Widget) => void;
  /** The chart's inner filter (v1 "Add / Update / Delete chart filter"); absent without ChartBuilder. */
  innerFilter?: InnerFilterHandlers;
  copy: (widget: Widget) => void;
  duplicate: (widget: Widget) => void;
  remove: (widget: Widget) => void;
}

export interface InnerFilterHandlers {
  add: (chart: ChartWidget) => void;
  config: (chart: ChartWidget) => void;
  remove: (chart: ChartWidget) => void;
}

/**
 * A widget's menu in edit mode (v1 `ActionWidgetMore` for charts, `OtherWidget` for text and images): items the viewer
 * lacks the permission for are disabled, as in v1. Tabs and filter panels have their own menu.
 */
export function widgetEditMenuItems(widget: Widget, permissions: DashboardPermissions, handlers: WidgetEditHandlers): MenuItems {
  const { canEdit, canCopy, canDelete } = permissions;
  const item = (key: string, label: string, onClick: () => void, enabled: boolean) => ({ key, label, onClick, disabled: !enabled });
  const items: MenuItems = [];
  if (widget.kind === 'chart') {
    items.push(item('rename', 'Edit title', () => handlers.rename(widget), canEdit));
    if (handlers.configChart) items.push(item('config', 'Config chart', () => handlers.configChart?.(widget), canEdit));
  }
  if (widget.kind === 'text') items.push(item('edit-text', 'Edit text', () => handlers.editText(widget), canEdit));
  if (widget.kind === 'image') items.push(item('replace-image', 'Replace image', () => handlers.replaceImage(widget), canEdit));
  if (widget.kind === 'chart' || widget.kind === 'text') items.push(item('copy', widget.kind === 'chart' ? 'Copy chart' : 'Copy widget', () => handlers.copy(widget), canCopy));
  const inner = handlers.innerFilter;
  if (widget.kind === 'chart' && inner) {
    if (widget.chartFilter) {
      items.push(item('config-inner-filter', 'Update chart filter', () => inner.config(widget), canEdit));
      items.push(item('delete-inner-filter', 'Delete chart filter', () => inner.remove(widget), canEdit));
    } else {
      items.push(item('add-inner-filter', 'Add chart filter', () => inner.add(widget), canEdit));
    }
  }
  if (widget.kind !== 'tab' && widget.kind !== 'filter_panel') {
    items.push(item('duplicate', 'Duplicate', () => handlers.duplicate(widget), canCopy));
  }
  items.push(item('delete', 'Delete', () => handlers.remove(widget), canDelete));
  return items;
}

/** What the header's Add menu does (v1 `DashboardControlBar.items`). */
export interface AddHandlers {
  addText: () => void;
  addImage: () => void;
  addTab: () => void;
  addFilterPanel: () => void;
  paste?: () => void;
  /** Opens ChartBuilder for a new chart; absent without ChartBuilder. */
  addChart?: () => void;
}

export function addMenuItems(handlers: AddHandlers): MenuItems {
  return [
    ...(handlers.addChart ? [{ key: 'chart', label: 'Add chart', onClick: handlers.addChart }] : []),
    { key: 'tab', label: 'Add tab', onClick: handlers.addTab },
    { key: 'filter-panel', label: 'Add panel filters', onClick: handlers.addFilterPanel },
    { key: 'text', label: 'Add text', onClick: handlers.addText },
    { key: 'image', label: 'Add image', onClick: handlers.addImage },
    { key: 'paste', label: 'Paste chart', onClick: handlers.paste, disabled: !handlers.paste }
  ];
}

/**
 * Whether going to `pathname` leaves this dashboard. Renaming rewrites the URL to `/dashboard/<new slug>-<id>`, which
 * doesn't.
 */
export function leavesDashboard(pathname: string, dashboardId: number): boolean {
  const match = /^\/dashboard\/(?:.*-)?(\d+)$/.exec(pathname);
  return !match || Number(match[1]) !== dashboardId;
}
