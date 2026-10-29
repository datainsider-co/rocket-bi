import type { ReactNode } from 'react';
import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { FIELD_NO_DRAG_CLASS } from '@/shared/field-dnd/FieldPointerSensor';

/** An entry of a row's menu. */
export interface ActionItem<T extends string> {
  readonly key: T;
  readonly label: string;
  readonly danger?: boolean;
}

interface ActionMenuViewProps<T extends string> {
  items: readonly ActionItem<T>[];
  onAction: (action: T) => void;
  /** What the menu is for, in the button's label. */
  target: string;
  /** The row the menu also opens on with a right click (v1 opened these menus that way only). */
  children: ReactNode;
}

/** A tree row with a "..." menu, shown on hover, that also opens on right click. */
export function ActionMenuView<T extends string>({ items, onAction, target, children }: ActionMenuViewProps<T>) {
  const menu = { items: items.map(item => ({ key: item.key, label: item.label, danger: item.danger })), onClick: ({ key }: { key: string }) => onAction(key as T) };
  return (
    <Dropdown trigger={['contextMenu']} menu={menu}>
      <div className="group flex min-w-0 items-center">
        <div className="min-w-0 flex-1">{children}</div>
        <Dropdown trigger={['click']} menu={menu}>
          <Button
            type="text"
            size="small"
            className={`${FIELD_NO_DRAG_CLASS} shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100`}
            icon={<MoreOutlined />}
            aria-label={`Actions of ${target}`}
          />
        </Dropdown>
      </div>
    </Dropdown>
  );
}
