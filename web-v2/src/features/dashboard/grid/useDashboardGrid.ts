import { useCallback, useMemo } from 'react';
import { getCompactor, type Compactor, type Layout, type LayoutItem } from 'react-grid-layout';
import { maxZIndex, type Position, type PositionMap, type WidgetId } from '@/core/dashboard/Position';
import { bringToFront, changedPositions, GRID_COLUMNS, toLayout, toStackedLayout } from './dashboardGrid.utils';

export interface DashboardGridOptions {
  positions: PositionMap;
  /** Edit mode: widgets can be moved and resized. Ignored on mobile. */
  editable: boolean;
  /** Dashboard setting `enableOverlap`: free placement, widgets may overlap and are layered by z-index. */
  overlap: boolean;
  mobile: boolean;
  /** Called with only the widgets whose position changed. Never called in view mode or on mobile. */
  onPositionsChange?: (changed: Record<WidgetId, Position>) => void;
}

export interface DashboardGridState {
  layout: LayoutItem[];
  cols: number;
  compactor: Compactor;
  editable: boolean;
  /** z-index per widget id, only in overlap mode. */
  zIndexes: Readonly<Record<string, number>> | undefined;
  /** z-index for the widget being dragged or resized, so it stays above the others. */
  topZIndex: number;
}

/** Free placement with overlap (v1 `float` + its overlap patch), or gridstack's default: no overlap, pull up. */
const overlapCompactor = getCompactor(null, true);
const stackCompactor = getCompactor('vertical');

export function useDashboardGrid({ positions, editable, overlap, mobile, onPositionsChange }: DashboardGridOptions) {
  const canEdit = editable && !mobile;
  const layered = overlap && !mobile;

  const grid = useMemo<DashboardGridState>(
    () => ({
      layout: mobile ? toStackedLayout(positions) : toLayout(positions, GRID_COLUMNS),
      cols: mobile ? 1 : GRID_COLUMNS,
      compactor: layered ? overlapCompactor : stackCompactor,
      editable: canEdit,
      zIndexes: layered
        ? Object.fromEntries(Object.entries(positions).map(([id, position]) => [id, position.zIndex]))
        : undefined,
      topZIndex: maxZIndex(positions) + 1
    }),
    [positions, mobile, layered, canEdit]
  );

  // react-grid-layout also reports layouts it compacted itself (on mount, when overlap is turned off). Saving those
  // is intended: the grid shows them, so they are what the user sees. The mobile layout is never reported.
  const onLayoutChange = useCallback(
    (layout: Layout) => {
      if (!canEdit || !onPositionsChange) return;
      const changed = changedPositions(positions, layout);
      if (Object.keys(changed).length > 0) onPositionsChange(changed);
    },
    [canEdit, positions, onPositionsChange]
  );

  const onItemPointerDown = useCallback(
    (id: WidgetId) => {
      if (!canEdit || !layered || !onPositionsChange) return;
      const raised = bringToFront(positions, id);
      if (raised) onPositionsChange({ [id]: raised });
    },
    [canEdit, layered, positions, onPositionsChange]
  );

  return { grid, onLayoutChange, onItemPointerDown };
}
