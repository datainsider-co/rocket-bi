import type { ReactNode } from 'react';
import { useContainerWidth } from 'react-grid-layout';
import type { Position, PositionMap, WidgetId } from '@/core/dashboard/Position';
import { DASHBOARD_MARGIN } from './dashboardGrid.utils';
import { DashboardGridView } from './DashboardGridView';
import { useDashboardGrid } from './useDashboardGrid';

/** How a grid inside a widget (a tab, a filter panel) follows edit mode. */
export interface NestedGridEdit {
  editable: boolean;
  onPositionsChange?: (changed: Record<WidgetId, Position>) => void;
}

export interface DashboardGridProps {
  /** Positions of the widgets in this grid only (a tab widget passes its own widgets). */
  positions: PositionMap;
  renderItem: (id: WidgetId) => ReactNode;
  editable: boolean;
  overlap?: boolean;
  /** From `useIsMobile()` at the page level, so nested grids follow the dashboard. */
  mobile?: boolean;
  /** Px between widgets: `DASHBOARD_MARGIN`, or `NESTED_GRID_MARGIN` inside tab and filter panel widgets. */
  margin?: number;
  /**
   * Called after a drag, resize or bring-to-front with only the changed widgets. Merge them into the dashboard's
   * positions and save the whole map (see `DashboardService.resizeWidgets`).
   */
  onPositionsChange?: (changed: Record<WidgetId, Position>) => void;
}

/**
 * The dashboard's widget grid (v1 `DiGridstack` + `Dashboard.vue`): 48 columns, v1's cell size, optional overlap,
 * one column on mobile. Controlled: it shows `positions` and reports changes, the caller owns the state.
 */
export function DashboardGrid({ margin = DASHBOARD_MARGIN, renderItem, ...options }: DashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const { grid, onLayoutChange, onItemPointerDown } = useDashboardGrid({
    ...options,
    overlap: options.overlap ?? false,
    mobile: options.mobile ?? false
  });

  return (
    <div ref={containerRef}>
      {mounted && (
        <DashboardGridView
          width={width}
          grid={grid}
          margin={margin}
          renderItem={renderItem}
          onLayoutChange={onLayoutChange}
          onItemPointerDown={onItemPointerDown}
        />
      )}
    </div>
  );
}
