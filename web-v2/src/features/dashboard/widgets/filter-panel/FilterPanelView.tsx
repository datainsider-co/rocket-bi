import type { ReactNode } from 'react';
import { Button, Empty } from 'antd';
import type { Position, WidgetId } from '@/core/dashboard/Position';
import { DashboardGrid } from '../../grid/DashboardGrid';
import { NESTED_GRID_MARGIN } from '../../grid/dashboardGrid.utils';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import type { FilterPanelLook } from './filterPanel.utils';

interface FilterPanelViewProps {
  title: string;
  look: FilterPanelLook;
  positions: Readonly<Record<WidgetId, Position>>;
  grid: { overlap: boolean; mobile: boolean };
  renderWidget: (id: WidgetId) => ReactNode;
  onApply: () => void;
}

/**
 * v1 `FilterPanelViewer` in view mode: a title, the panel's filters in their own grid, and an Apply button. The filters
 * show their changes at once; charts get them on Apply.
 */
export function FilterPanelView({ title, look, positions, grid, renderWidget, onApply }: FilterPanelViewProps) {
  const isEmpty = Object.keys(positions).length === 0;
  return (
    <div className={`flex h-full flex-col ${GRID_NO_DRAG_CLASS}`}>
      <div className="flex items-center gap-2 pb-2 font-medium" style={look.header}>
        <i className="di-icon-filter-panel" />
        <span className="truncate">{title}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {isEmpty ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Your panel is empty" />
        ) : (
          <DashboardGrid positions={positions} renderItem={renderWidget} editable={false} overlap={grid.overlap} mobile={grid.mobile} margin={NESTED_GRID_MARGIN} />
        )}
      </div>
      <div className="flex pt-2" style={{ justifyContent: look.align }}>
        <Button type="primary" style={{ ...look.apply, borderColor: 'transparent' }} disabled={isEmpty} onClick={onApply}>
          {look.applyTitle}
        </Button>
      </div>
    </div>
  );
}
