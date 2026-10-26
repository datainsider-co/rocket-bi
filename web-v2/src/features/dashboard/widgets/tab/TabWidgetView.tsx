import type { ReactNode } from 'react';
import { Empty, Tabs } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { TabWidget } from '@/core/dashboard/Widget';
import { tabPositions } from '../../detail/dashboardDetail.utils';
import { DashboardGrid, type NestedGridEdit } from '../../grid/DashboardGrid';
import { NESTED_GRID_MARGIN } from '../../grid/dashboardGrid.utils';
import { tabHeaderCssVars, type TabHeaderStyle } from './tabWidget.utils';
import './TabWidget.css';

interface TabWidgetViewProps {
  widget: TabWidget;
  dashboard: Dashboard;
  mobile: boolean;
  renderWidget: (id: WidgetId) => ReactNode;
  edit: NestedGridEdit;
  /** The open tab, by index. */
  active: number;
  onActiveChange: (index: number) => void;
  header: TabHeaderStyle;
}

/**
 * v1 `TabViewer.vue`: one grid per tab, only the open tab rendered (v1 `lazy`), headers on top or on the left. Its
 * widgets move in edit mode; the header bar drags the whole widget.
 */
export function TabWidgetView({ widget, dashboard, mobile, renderWidget, edit, active, onActiveChange, header }: TabWidgetViewProps) {
  return (
    <Tabs
      className="tab-widget h-full"
      style={tabHeaderCssVars(header)}
      size="small"
      tabPlacement={header.position === 'vertical' ? 'start' : 'top'}
      activeKey={String(Math.min(active, Math.max(widget.tabItems.length - 1, 0)))}
      onChange={key => onActiveChange(Number(key))}
      destroyOnHidden
      items={widget.tabItems.map((tab, index) => ({
        key: String(index),
        label: tab.name,
        children:
          tab.widgetIds.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Your tab is empty" />
          ) : (
            <div className="h-full overflow-auto">
              <DashboardGrid
                positions={tabPositions(dashboard, tab)}
                renderItem={renderWidget}
                editable={edit.editable}
                onPositionsChange={edit.onPositionsChange}
                overlap={dashboard.setting.enableOverlap}
                mobile={mobile}
                margin={NESTED_GRID_MARGIN}
              />
            </div>
          )
      }))}
    />
  );
}
