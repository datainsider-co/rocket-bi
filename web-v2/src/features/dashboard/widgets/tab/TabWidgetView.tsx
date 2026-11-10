import type { ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { TabWidget } from '@/core/dashboard/Widget';
import { tabPositions } from '../../detail/dashboardDetail.utils';
import { DashboardGrid, type NestedGridEdit } from '../../grid/DashboardGrid';
import { NESTED_GRID_MARGIN } from '../../grid/dashboardGrid.utils';
import { EmptyNestedView } from '../EmptyNestedView';
import { menuAction } from '../menu/menuAction.utils';
import { TabNavView, type TabMenus } from './TabNavView';
import { openTabIndex, tabHeaderCssVars, type TabHeaderStyle } from './tabWidget.utils';
import './TabWidget.css';

interface TabWidgetViewProps {
  widget: TabWidget;
  dashboard: Dashboard;
  mobile: boolean;
  renderWidget: (id: WidgetId) => ReactNode;
  edit: NestedGridEdit & { menus?: TabMenus };
  /** The open tab, by index. */
  active: number;
  onActiveChange: (index: number) => void;
  header: TabHeaderStyle;
}

/**
 * v1 `TabViewer.vue`: no card, boxed tab headers on top or on the left, and the open tab's grid on the chart
 * background (only that tab rendered, v1 `lazy`). Its widgets move in edit mode; the header drags the whole widget.
 */
export function TabWidgetView({ widget, dashboard, mobile, renderWidget, edit, active, onActiveChange, header }: TabWidgetViewProps) {
  const open = openTabIndex(active, widget.tabItems.length);
  const tab = widget.tabItems[open];
  return (
    <div className="tab-widget" data-position={header.position} style={tabHeaderCssVars(header)}>
      <TabNavView tabs={widget.tabItems} active={open} onActiveChange={onActiveChange} menus={edit.menus} />
      <div className="tab-widget__body" role="tabpanel" aria-label={tab?.name}>
        {!tab ? (
          <EmptyNestedView>There are no open tabs</EmptyNestedView>
        ) : tab.widgetIds.length === 0 ? (
          <EmptyNestedView onAdd={edit.menus && menuAction(edit.menus.tab(open), 'add-widgets')}>Your tab is empty</EmptyNestedView>
        ) : (
          <div className="tab-widget__grid">
            <DashboardGrid
              key={open}
              positions={tabPositions(dashboard, tab)}
              renderItem={renderWidget}
              editable={edit.editable}
              onPositionsChange={edit.onPositionsChange}
              overlap={dashboard.setting.enableOverlap}
              mobile={mobile}
              margin={NESTED_GRID_MARGIN}
            />
          </div>
        )}
      </div>
    </div>
  );
}
