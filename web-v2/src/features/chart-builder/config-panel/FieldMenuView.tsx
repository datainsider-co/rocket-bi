import type { ReactElement } from 'react';
import { Dropdown } from 'antd';
import type { TableNode } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';
import { anyField, fieldMenuItems, fieldOfKey, type FieldFilter } from './fieldMenu.utils';

interface FieldMenuViewProps {
  tables: readonly TableNode[];
  accepts?: FieldFilter;
  onPick: (field: DroppedField) => void;
  /** What opens the menu on click. */
  children: ReactElement;
}

/** Picks a field from a menu of tables (v1 `SelectFieldContext`), instead of dragging it from the tree. */
export function FieldMenuView({ tables, accepts = anyField, onPick, children }: FieldMenuViewProps) {
  const items = fieldMenuItems(tables, accepts);
  return (
    <Dropdown
      trigger={['click']}
      disabled={items.length === 0}
      menu={{
        items,
        onClick: ({ key }) => {
          const field = fieldOfKey(tables, key);
          if (field) onPick(field);
        }
      }}
    >
      {children}
    </Dropdown>
  );
}
