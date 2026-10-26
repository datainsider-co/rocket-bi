import { Dropdown } from 'antd';

interface PointMenuViewProps {
  /** Where the point was clicked, in viewport pixels; no menu when absent. */
  position?: { x: number; y: number };
  value: string;
  canReset: boolean;
  onUseAsFilter: () => void;
  onReset: () => void;
  onClose: () => void;
}

/**
 * The menu of a clicked data point (v1 `WidgetContextMenu.getMenuOptions`, opened by a right click there). Drill down,
 * drill through and downloads come with the widget actions.
 */
export function PointMenuView({ position, value, canReset, onUseAsFilter, onReset, onClose }: PointMenuViewProps) {
  if (!position) return null;
  return (
    <Dropdown
      open
      onOpenChange={open => !open && onClose()}
      menu={{
        items: [
          { key: 'filter', label: `Use "${value}" as a filter`, onClick: onUseAsFilter },
          { key: 'reset', label: 'Reset filter', disabled: !canReset, onClick: onReset }
        ]
      }}
    >
      <span aria-hidden style={{ position: 'fixed', left: position.x, top: position.y, width: 1, height: 1 }} />
    </Dropdown>
  );
}
