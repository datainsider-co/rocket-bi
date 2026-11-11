import { Dropdown, type MenuProps } from 'antd';
import { PointAnchor } from './PointAnchor';
import '../menu/WidgetMenu.css';

type MenuItems = NonNullable<MenuProps['items']>;

const MENU_CLASS = 'chart-point-menu';

/** Submenus pop up outside the menu's own element, so each gets the class too; a group is part of its menu and only passes it on. */
function withPopupClass(items: MenuItems): MenuItems {
  return items.map(item => {
    if (!item || !('children' in item) || !item.children) return item;
    const children = withPopupClass(item.children);
    return (item.type === 'group' ? { ...item, children } : { ...item, popupClassName: MENU_CLASS, children }) as MenuItems[number];
  });
}

interface PointMenuViewProps {
  /** Where the point was clicked, in viewport pixels; no menu when absent. */
  position?: { x: number; y: number };
  items: MenuItems;
  /** Whether a click on the item leaves the menu open ("Load more", a step that follows in place). */
  staysOpen?: (key: string) => boolean;
  onClose: () => void;
}

/** A chart's menu at a clicked data point or at a right click on its card (v1 `WidgetContextMenu` in a `vue-context`). */
export function PointMenuView({ position, items, staysOpen, onClose }: PointMenuViewProps) {
  if (!position || items.length === 0) return null;
  return (
    <PointAnchor position={position}>
      {anchor => (
        <Dropdown
          open
          classNames={{ root: MENU_CLASS }}
          // A click outside closes it; item clicks close it below, unless the item keeps it open.
          onOpenChange={(open, info) => !open && info.source === 'trigger' && onClose()}
          menu={{ items: withPopupClass(items), onClick: ({ key }) => !staysOpen?.(key) && onClose() }}
        >
          {anchor}
        </Dropdown>
      )}
    </PointAnchor>
  );
}
