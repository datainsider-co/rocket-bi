import type { CSSProperties, ReactNode } from 'react';
import GridLayout, { type Layout, type ResizeHandleAxis } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type { WidgetId } from '@/core/dashboard/Position';
import type { DashboardGridState } from './useDashboardGrid';
import { gridMetrics } from './dashboardGrid.utils';
import './DashboardGrid.css';

/** Add this class to anything inside a widget that must not start a drag (inputs, menus, scrollable lists). */
export const GRID_NO_DRAG_CLASS = 'dashboard-grid-no-drag';

const RESIZE_HANDLES: ResizeHandleAxis[] = ['e', 'se', 's', 'sw', 'w'];
// A grid inside a widget (tab, filter panel) handles its own drags: pressing inside it must not drag the widget.
const DRAG_CANCEL = `.${GRID_NO_DRAG_CLASS}, .react-grid-layout .react-grid-layout`;

export interface DashboardGridViewProps {
  width: number;
  grid: DashboardGridState;
  margin: number;
  renderItem: (id: WidgetId) => ReactNode;
  onLayoutChange: (layout: Layout) => void;
  onItemPointerDown: (id: WidgetId) => void;
}

export function DashboardGridView({ width, grid, margin, renderItem, onLayoutChange, onItemPointerDown }: DashboardGridViewProps) {
  const { rowHeight, margin: gap, containerPadding } = gridMetrics(margin);
  const style = { '--dashboard-grid-top-z': grid.topZIndex } as CSSProperties;

  return (
    <GridLayout
      className={grid.editable ? 'dashboard-grid dashboard-grid--editable' : 'dashboard-grid'}
      style={style}
      width={width}
      layout={grid.layout}
      gridConfig={{ cols: grid.cols, rowHeight, margin: gap, containerPadding }}
      dragConfig={{ enabled: grid.editable, cancel: DRAG_CANCEL, threshold: 3 }}
      resizeConfig={{ enabled: grid.editable, handles: RESIZE_HANDLES }}
      compactor={grid.compactor}
      onLayoutChange={onLayoutChange}
    >
      {grid.layout.map(({ i }) => {
        const id = Number(i);
        return (
          <div
            key={i}
            data-widget-id={i}
            className="dashboard-grid__item"
            style={{ zIndex: grid.zIndexes?.[i] }}
            onPointerDown={() => onItemPointerDown(id)}
          >
            {renderItem(id)}
          </div>
        );
      })}
    </GridLayout>
  );
}
