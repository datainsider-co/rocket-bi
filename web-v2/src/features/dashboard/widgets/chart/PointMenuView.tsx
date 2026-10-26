import { Dropdown, type MenuProps } from 'antd';

interface PointMenuViewProps {
  /** Where the point was clicked, in viewport pixels; no menu when absent. */
  position?: { x: number; y: number };
  items: NonNullable<MenuProps['items']>;
  onClose: () => void;
}

/** The menu of a clicked data point (v1 `WidgetContextMenu.getMenuOptions`), at the click. */
export function PointMenuView({ position, items, onClose }: PointMenuViewProps) {
  if (!position) return null;
  return (
    <Dropdown open onOpenChange={open => !open && onClose()} menu={{ items }}>
      <span aria-hidden style={{ position: 'fixed', left: position.x, top: position.y, width: 1, height: 1 }} />
    </Dropdown>
  );
}
