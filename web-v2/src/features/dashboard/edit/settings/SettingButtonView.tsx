import { CheckOutlined } from '@ant-design/icons';
import { Dropdown, type MenuProps } from 'antd';
import { inDashboardPage } from '../../theme/popupContainer';
import type { SettingMenuItem } from './settingMenu.utils';
import './settings.css';

type MenuItems = NonNullable<MenuProps['items']>;

function toMenuItems(items: readonly SettingMenuItem[]): MenuItems {
  return items.map(item => ({
    key: item.key,
    label: item.label,
    icon: item.icon ? <i className={item.icon} aria-hidden /> : undefined,
    extra: item.active ? <CheckOutlined className="dashboard-setting-menu__check" aria-label="Current" /> : undefined,
    onClick: item.onSelect,
    ...(item.children && { children: toMenuItems(item.children), popupClassName: 'dashboard-setting-menu' })
  }));
}

interface SettingButtonViewProps {
  items: readonly SettingMenuItem[];
}

/** v1 `.dashboard--content--setting`: the gear at the dashboard's top right in edit mode, and its menu. */
export function SettingButtonView({ items }: SettingButtonViewProps) {
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{ items: toMenuItems(items), getPopupContainer: inDashboardPage }}
      classNames={{ root: 'dashboard-setting-menu' }}
      getPopupContainer={inDashboardPage}
    >
      <button type="button" className="dashboard-setting-button" title="Setting Dashboard" aria-label="Setting Dashboard">
        <i className="di-icon-setting" aria-hidden />
      </button>
    </Dropdown>
  );
}
