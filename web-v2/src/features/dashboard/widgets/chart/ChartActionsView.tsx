import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { WidgetMenuView } from '../menu/WidgetMenuView';

type MenuItems = NonNullable<MenuProps['items']>;

interface ChartActionsViewProps {
  /** The chart's inner filter, if it has one. */
  innerFilter?: ReactNode;
  /** The header filters' icon, rendering nothing without header filters. */
  appliedFilters?: ReactNode;
  /** Edit mode: the widget's edit items behind v1's gear. */
  editItems?: MenuItems;
  /** View mode: the date functions behind the zoom button, when the chart shows it. */
  zoomItems?: MenuItems;
  /** View mode: the drilldown button, when the chart shows it. */
  drill?: ReactNode;
}

/**
 * The chart's action bar (v1 `ChartHolder` `#action-bar`): its inner filter, the applied filters, then the gear in
 * edit mode or, in view mode, the zoom and drilldown buttons of charts that turn them on (v1 `ActionWidgetMore`). The
 * rest of a chart's actions are in its menu (a click on a point, a right click on the card).
 */
export function ChartActionsView({ innerFilter, appliedFilters, editItems, zoomItems, drill }: ChartActionsViewProps) {
  if (!innerFilter && !appliedFilters && !editItems?.length && !zoomItems && !drill) return null;
  return (
    <div className={`chart-actions ${GRID_NO_DRAG_CLASS}`}>
      {innerFilter}
      {appliedFilters}
      {editItems ? (
        <WidgetMenuView items={editItems} label="Widget actions" trigger="setting" />
      ) : (
        <>
          {zoomItems && <WidgetMenuView items={zoomItems} label="Zoom" trigger="zoom" />}
          {drill}
        </>
      )}
    </div>
  );
}
