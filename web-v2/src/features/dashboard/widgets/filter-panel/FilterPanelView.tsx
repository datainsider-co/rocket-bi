import type { ReactNode } from 'react';
import { Button, Empty } from 'antd';
import type { Position, WidgetId } from '@/core/dashboard/Position';
import { DashboardGrid, type NestedGridEdit } from '../../grid/DashboardGrid';
import { NESTED_GRID_MARGIN } from '../../grid/dashboardGrid.utils';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import type { FilterPanelLook } from './filterPanel.utils';
import './FilterPanel.css';

interface FilterPanelViewProps {
  title: string;
  look: FilterPanelLook;
  positions: Readonly<Record<WidgetId, Position>>;
  grid: { overlap: boolean; mobile: boolean } & NestedGridEdit;
  renderWidget: (id: WidgetId) => ReactNode;
  onApply: () => void;
  /** Edit mode: the panel's menu, at the end of the header (v1's gear). */
  actions?: ReactNode;
}

/**
 * v1 `FilterPanelViewer` in view mode: a header with the panel's icon and title, the panel's filters in their own grid,
 * and a footer with Apply, all on the panel's background. The filters show their changes at once; charts get them on
 * Apply.
 */
export function FilterPanelView({ title, look, positions, grid, renderWidget, onApply, actions }: FilterPanelViewProps) {
  const isEmpty = Object.keys(positions).length === 0;
  return (
    <div className="filter-panel" style={{ background: look.background }}>
      <div className="filter-panel__header" style={look.header}>
        <i className="di-icon-filter-panel" aria-hidden />
        <span className="filter-panel__title">{title}</span>
        {actions && <span className={`filter-panel__actions ${GRID_NO_DRAG_CLASS}`}>{actions}</span>}
      </div>
      <div className="filter-panel__body">
        {isEmpty ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Your panel is empty" />
        ) : (
          <DashboardGrid
            positions={positions}
            renderItem={renderWidget}
            editable={grid.editable}
            onPositionsChange={grid.onPositionsChange}
            overlap={grid.overlap}
            mobile={grid.mobile}
            margin={NESTED_GRID_MARGIN}
          />
        )}
      </div>
      <div className={`filter-panel__footer ${GRID_NO_DRAG_CLASS}`} style={{ justifyContent: look.align }}>
        <Button className="filter-panel__apply" type="primary" style={look.apply} disabled={isEmpty} onClick={onApply}>
          {look.applyTitle}
        </Button>
      </div>
    </div>
  );
}
