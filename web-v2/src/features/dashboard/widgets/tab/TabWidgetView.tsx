import { useState, type ReactNode } from 'react';
import { Empty, Tabs } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { TabWidget } from '@/core/dashboard/Widget';
import { DashboardGrid } from '../../grid/DashboardGrid';
import { NESTED_GRID_MARGIN } from '../../grid/dashboardGrid.utils';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { tabPositions } from '../../detail/dashboardDetail.utils';

interface TabWidgetViewProps {
  widget: TabWidget;
  dashboard: Dashboard;
  mobile: boolean;
  renderWidget: (id: WidgetId) => ReactNode;
}

/**
 * v1 `TabViewer.vue` in view mode: one grid per tab, only the open tab rendered (v1 `lazy`). Filter panels share it
 * until their own header, footer and apply button are ported.
 */
export function TabWidgetView({ widget, dashboard, mobile, renderWidget }: TabWidgetViewProps) {
  const [activeKey, setActiveKey] = useState('0');

  return (
    <Tabs
      className={`h-full ${GRID_NO_DRAG_CLASS}`}
      size="small"
      activeKey={activeKey}
      onChange={setActiveKey}
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
                editable={false}
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
