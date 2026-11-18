import { useCallback, useMemo, type ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { Widget } from '@/core/dashboard/Widget';
import { useDashboardEdit } from '../edit/DashboardEditContext';
import { DashboardGrid } from '../grid/DashboardGrid';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { dashboardCssVars, topLevelPositions } from './dashboardDetail.utils';
import { EmptyDashboardView } from './EmptyDashboardView';

interface DashboardCanvasProps {
  dashboard: Dashboard;
  /** A phone sized viewport: the grids show one column, unless the dashboard's setting freezes its layout. */
  mobile: boolean;
  /** Shown at the top right corner, which stays in view while the page scrolls (the settings gear in edit mode). */
  corner?: ReactNode;
  /** Opens ChartBuilder from the empty dashboard; absent when the viewer can't add a chart now. */
  onAddChart?: () => void;
}

/** The dashboard's content box and its widget grid (v1 `Dashboard.vue` inside `DashboardDetail.vue`). */
export function DashboardCanvas({ dashboard, mobile, corner, onAddChart }: DashboardCanvasProps) {
  const widgetsById = useMemo(() => new Map<WidgetId, Widget>(dashboard.widgets.map(widget => [widget.id, widget])), [dashboard.widgets]);
  const positions = useMemo(() => topLevelPositions(dashboard), [dashboard]);
  const { editing, onPositionsChange } = useDashboardEdit();
  // "Disable Responsive": every grid, nested ones included, keeps its columns on a phone.
  const stacked = mobile && !dashboard.setting.isFrozen;

  const renderWidget = useCallback(
    function render(id: WidgetId) {
      const widget = widgetsById.get(id);
      return widget ? <WidgetRenderer widget={widget} dashboard={dashboard} mobile={stacked} renderWidget={render} /> : null;
    },
    [widgetsById, dashboard, stacked]
  );

  const { setting } = dashboard;
  return (
    <div
      className="dashboard-content"
      style={dashboardCssVars(setting)}
      data-fit-mode={setting.backgroundImage.fitMode}
      data-frozen={setting.isFrozen || undefined}
    >
      {corner && <div className="dashboard-content__corner">{corner}</div>}
      {Object.keys(positions).length === 0 ? (
        <EmptyDashboardView onAddChart={onAddChart} />
      ) : (
        <DashboardGrid
          positions={positions}
          renderItem={renderWidget}
          editable={editing}
          onPositionsChange={onPositionsChange}
          overlap={setting.enableOverlap}
          mobile={stacked}
        />
      )}
    </div>
  );
}
