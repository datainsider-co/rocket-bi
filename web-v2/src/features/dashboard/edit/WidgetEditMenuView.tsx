import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../grid/DashboardGridView';

/** A widget's menu button in edit mode (v1 `ActionMore`). */
export function WidgetEditMenuView({ items }: { items: NonNullable<MenuProps['items']> }) {
  return (
    <span className={`p-1 ${GRID_NO_DRAG_CLASS}`}>
      <Dropdown trigger={['click']} menu={{ items }} placement="bottomRight">
        <Button type="text" size="small" icon={<MoreOutlined />} aria-label="Widget actions" />
      </Dropdown>
    </span>
  );
}
