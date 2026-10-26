import { Dropdown, type MenuProps } from 'antd';

interface PointMenuViewProps {
  /** Where the point was clicked, in viewport pixels; no menu when absent. */
  position?: { x: number; y: number };
  items: NonNullable<MenuProps['items']>;
  /** Items that leave the menu open when clicked ("Load more"). */
  keepOpenKeys?: readonly string[];
  onClose: () => void;
}

/** The menu of a clicked data point (v1 `WidgetContextMenu.getMenuOptions`), at the click. */
export function PointMenuView({ position, items, keepOpenKeys = [], onClose }: PointMenuViewProps) {
  if (!position) return null;
  return (
    <Dropdown
      open
      // A click outside closes it; item clicks close it below, unless the item keeps it open.
      onOpenChange={(open, info) => !open && info.source === 'trigger' && onClose()}
      menu={{ items, onClick: ({ key }) => !keepOpenKeys.includes(key) && onClose() }}
    >
      <span aria-hidden style={{ position: 'fixed', left: position.x, top: position.y, width: 1, height: 1 }} />
    </Dropdown>
  );
}
