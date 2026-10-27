import { createContext, use, useMemo, type ReactNode } from 'react';
import type { MenuProps } from 'antd';
import type { Position, WidgetId } from '@/core/dashboard/Position';
import type { TabWidget, Widget } from '@/core/dashboard/Widget';
import type { DashboardPermissions } from '../access/access.utils';
import { widgetEditMenuItems, type WidgetEditHandlers } from './editMenus.utils';
import { tabItemMenuItems, tabWidgetMenuItems, type TabEditHandlers } from './tabEdit.utils';

interface DashboardEditState {
  editing: boolean;
  /** Layout changes of any grid (the dashboard, a tab), kept until Save. */
  onPositionsChange: (changed: Record<WidgetId, Position>) => void;
  /** A widget's menu in edit mode. */
  widgetMenu: (widget: Widget) => NonNullable<MenuProps['items']>;
  /** A tab widget's or filter panel's own menu in edit mode. */
  tabMenu: (widget: TabWidget) => NonNullable<MenuProps['items']>;
  /** The menu of one tab of a tab widget in edit mode. */
  tabItemMenu: (widget: TabWidget, index: number) => NonNullable<MenuProps['items']>;
}

const DashboardEditContext = createContext<DashboardEditState | null>(null);

interface DashboardEditProviderProps {
  editing: boolean;
  onPositionsChange: (changed: Record<WidgetId, Position>) => void;
  permissions: DashboardPermissions;
  handlers: WidgetEditHandlers;
  tabHandlers: TabEditHandlers;
  children: ReactNode;
}

/** Edit mode for the widgets of one dashboard: whether it is on, and what their menus and grids do. */
export function DashboardEditProvider({ editing, onPositionsChange, permissions, handlers, tabHandlers, children }: DashboardEditProviderProps) {
  const value = useMemo(
    () => ({
      editing,
      onPositionsChange,
      widgetMenu: (widget: Widget) => widgetEditMenuItems(widget, permissions, handlers),
      tabMenu: (widget: TabWidget) => tabWidgetMenuItems(widget, permissions, tabHandlers),
      tabItemMenu: (widget: TabWidget, index: number) => tabItemMenuItems(widget, index, permissions, tabHandlers)
    }),
    [editing, onPositionsChange, permissions, handlers, tabHandlers]
  );
  return <DashboardEditContext value={value}>{children}</DashboardEditContext>;
}

export function useDashboardEdit(): DashboardEditState {
  const state = use(DashboardEditContext);
  if (!state) {
    throw new Error('useDashboardEdit must be used inside <DashboardEditProvider>');
  }
  return state;
}
