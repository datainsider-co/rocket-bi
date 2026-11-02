import { Dropdown } from 'antd';

export interface ConnectionMenuAnchor {
  readonly key: string;
  /** Where the line was clicked, relative to the canvas. */
  readonly x: number;
  readonly y: number;
}

interface ConnectionMenuProps {
  anchor: ConnectionMenuAnchor | null;
  onRemove: (key: string) => void;
  onClose: () => void;
}

/** "Remove" menu at the point where a line was clicked (v1 `ConnectionActionContextMenu`). */
export function ConnectionMenu({ anchor, onRemove, onClose }: ConnectionMenuProps) {
  if (!anchor) return null;
  return (
    <Dropdown
      open
      onOpenChange={open => !open && onClose()}
      menu={{
        items: [{ key: 'remove', label: 'Remove' }],
        onClick: () => {
          onRemove(anchor.key);
          onClose();
        }
      }}
    >
      <span className="pointer-events-none absolute size-px" style={{ left: anchor.x, top: anchor.y }} />
    </Dropdown>
  );
}
