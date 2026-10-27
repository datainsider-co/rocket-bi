import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { WidgetMenuView } from '../menu/WidgetMenuView';

interface ChartActionsViewProps {
  /** The chart's inner filter, if it has one. */
  innerFilter?: ReactNode;
  /** The header filters' icon, rendering nothing without header filters. */
  appliedFilters?: ReactNode;
  menuItems: NonNullable<MenuProps['items']>;
  /** Edit mode: the menu is v1's gear with the widget's edit items; in view mode, dots shown while hovering the card. */
  editing: boolean;
}

/** The chart's action bar (v1 `ChartHolder` `#action-bar`): its inner filter, the applied filters and its menu. */
export function ChartActionsView({ innerFilter, appliedFilters, menuItems, editing }: ChartActionsViewProps) {
  if (!innerFilter && !appliedFilters && menuItems.length === 0) return null;
  return (
    <div className={`chart-actions ${GRID_NO_DRAG_CLASS}`}>
      {innerFilter}
      {appliedFilters}
      {editing ? (
        <WidgetMenuView items={menuItems} label="Widget actions" trigger="setting" />
      ) : (
        <span className="chart-actions__hover">
          <WidgetMenuView items={menuItems} label="Chart actions" trigger="more" />
        </span>
      )}
    </div>
  );
}
