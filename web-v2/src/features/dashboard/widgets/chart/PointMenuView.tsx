import { Dropdown, type MenuProps } from 'antd';
import { PointAnchor } from './PointAnchor';
import '../menu/WidgetMenu.css';

type MenuItems = NonNullable<MenuProps['items']>;

const MENU_CLASS = 'chart-point-menu';

/** Submenus pop up outside the menu's own element, so each gets the class too. */
function withPopupClass(items: MenuItems): MenuItems {
  return items.map(item =>
    item && 'children' in item && item.children ? ({ ...item, popupClassName: MENU_CLASS, children: withPopupClass(item.children) } as MenuItems[number]) : item
  );
}

interface PointMenuViewProps {
  /** Where the point was clicked, in viewport pixels; no menu when absent. */
  position?: { x: number; y: number };
  items: MenuItems;
  /** Items that leave the menu open when clicked ("Load more"). */
  keepOpenKeys?: readonly string[];
  onClose: () => void;
}

/** A chart's menu at a clicked data point or at a right click on its card (v1 `WidgetContextMenu` in a `vue-context`). */
export function PointMenuView({ position, items, keepOpenKeys = [], onClose }: PointMenuViewProps) {
  if (!position || items.length === 0) return null;
  return (
    <PointAnchor position={position}>
      {anchor => (
        <Dropdown
          open
          classNames={{ root: MENU_CLASS }}
          // A click outside closes it; item clicks close it below, unless the item keeps it open.
          onOpenChange={(open, info) => !open && info.source === 'trigger' && onClose()}
          menu={{ items: withPopupClass(items), onClick: ({ key }) => !keepOpenKeys.includes(key) && onClose() }}
        >
          {anchor}
        </Dropdown>
      )}
    </PointAnchor>
  );
}
