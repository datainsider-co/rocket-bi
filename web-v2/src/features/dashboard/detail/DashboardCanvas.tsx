import { useCallback, useMemo } from 'react';
import { Empty } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { Widget } from '@/core/dashboard/Widget';
import { DashboardGrid } from '../grid/DashboardGrid';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { dashboardCssVars, topLevelPositions } from './dashboardDetail.utils';

interface DashboardCanvasProps {
  dashboard: Dashboard;
  mobile: boolean;
}

/** The dashboard's content box and its widget grid (v1 `Dashboard.vue` inside `DashboardDetail.vue`). */
export function DashboardCanvas({ dashboard, mobile }: DashboardCanvasProps) {
  const widgetsById = useMemo(() => new Map<WidgetId, Widget>(dashboard.widgets.map(widget => [widget.id, widget])), [dashboard.widgets]);
  const positions = useMemo(() => topLevelPositions(dashboard), [dashboard]);

  const renderWidget = useCallback(
    function render(id: WidgetId) {
      const widget = widgetsById.get(id);
      return widget ? <WidgetRenderer widget={widget} dashboard={dashboard} mobile={mobile} renderWidget={render} /> : null;
    },
    [widgetsById, dashboard, mobile]
  );

  const { setting } = dashboard;
  return (
    <div className="dashboard-content" style={dashboardCssVars(setting)} data-fit-mode={setting.backgroundImage.fitMode}>
      {Object.keys(positions).length === 0 ? (
        <Empty className="m-auto" description="Your dashboard is empty" />
      ) : (
        <DashboardGrid
          positions={positions}
          renderItem={renderWidget}
          editable={false}
          overlap={setting.enableOverlap}
          mobile={mobile}
        />
      )}
    </div>
  );
}
