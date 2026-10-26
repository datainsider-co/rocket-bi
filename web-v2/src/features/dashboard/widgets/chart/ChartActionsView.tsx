import type { ReactNode } from 'react';
import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';

interface ChartActionsViewProps {
  /** The chart's inner filter, if it has one. */
  innerFilter?: ReactNode;
  /** The header filters' icon, rendering nothing without header filters. */
  appliedFilters?: ReactNode;
  menuItems: NonNullable<MenuProps['items']>;
}

/** The chart's action bar (v1 `ChartHolder` `#action-bar`): its inner filter, the applied filters and its menu. */
export function ChartActionsView({ innerFilter, appliedFilters, menuItems }: ChartActionsViewProps) {
  if (!innerFilter && !appliedFilters && menuItems.length === 0) return null;
  return (
    <div className={`flex items-center gap-1 p-2 ${GRID_NO_DRAG_CLASS}`}>
      {innerFilter}
      {appliedFilters}
      {menuItems.length > 0 && (
        <Dropdown trigger={['click']} menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" size="small" icon={<MoreOutlined />} aria-label="Chart actions" />
        </Dropdown>
      )}
    </div>
  );
}
