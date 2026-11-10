import { MoreOutlined } from '@ant-design/icons';
import { Dropdown, type MenuProps } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { inDashboardPage } from '../../theme/popupContainer';
import { menuIconClass } from './menuIcons.utils';
import './WidgetMenu.css';

type MenuItems = NonNullable<MenuProps['items']>;

/** Adds v1's icon to each item that had one, in submenus and groups too. */
function withIcons(items: MenuItems): MenuItems {
  return items.map(item => {
    if (!item || item.type === 'divider') return item;
    const icon = typeof item.key === 'string' ? menuIconClass(item.key) : undefined;
    // A submenu pops up outside `.widget-menu`, so it carries the class itself.
    const children = 'children' in item && item.children ? { children: withIcons(item.children), popupClassName: 'widget-menu' } : {};
    return { ...item, ...children, ...(icon ? { icon: <i className={icon} aria-hidden /> } : {}) } as MenuItems[number];
  });
}

interface WidgetMenuViewProps {
  items: MenuItems;
  /** The button's accessible name. */
  label: string;
  /** v1's gear (`di-icon-setting`) on widgets in edit mode, its vertical dots on a tab, or a chart's zoom button. */
  trigger: 'setting' | 'more' | 'zoom';
  /** `small` for the dots in a tab's header, `panel` for a filter panel's gear (14px in 9px of padding). */
  size?: 'default' | 'small' | 'panel';
}

/**
 * A widget's menu button and its popup (v1 `ActionWidgetMore` / `OtherWidget` popover): 40px ghost button, a 210px
 * menu of icon and label rows. Pops up inside the dashboard page so it takes the theme's colors.
 */
export function WidgetMenuView({ items, label, trigger, size = 'default' }: WidgetMenuViewProps) {
  if (items.length === 0) return null;
  return (
    <Dropdown
      trigger={['click']}
      menu={{ items: withIcons(items) }}
      placement="bottomRight"
      // v1's popover sat 14px in from the button's right edge, 9px under it.
      align={{ offset: [-14, 9] }}
      classNames={{ root: 'widget-menu' }}
      getPopupContainer={inDashboardPage}
    >
      <button type="button" className={`widget-menu-button widget-menu-button--${size} ${GRID_NO_DRAG_CLASS}`} aria-label={label} title={label}>
        {trigger === 'more' ? <MoreOutlined aria-hidden /> : <i className={trigger === 'zoom' ? 'di-icon-zoom' : 'di-icon-setting'} aria-hidden />}
      </button>
    </Dropdown>
  );
}
