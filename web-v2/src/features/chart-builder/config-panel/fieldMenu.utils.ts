import type { MenuProps } from 'antd';
import type { FieldNode, TableNode } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';

type MenuItems = NonNullable<MenuProps['items']>;

/** Which fields a menu offers: every one by default; the Filters zone leaves measures out. */
export type FieldFilter = (node: FieldNode) => boolean;

export const anyField: FieldFilter = () => true;

/** Columns can be filtered; measures can't (v1 `FilterDraggable`). */
export const filterableField: FieldFilter = node => node.role !== 'measure';

/**
 * The tables and their fields as a menu (v1 `SelectFieldContext.showTableAndFields`): a submenu per table, nested
 * columns one level deeper. Tables left without fields are left out.
 */
export function fieldMenuItems(tables: readonly TableNode[], accepts: FieldFilter = anyField): MenuItems {
  return tables.flatMap(table => {
    const children = table.items.flatMap(item => {
      if (item.kind === 'field') return accepts(item) ? [{ key: item.key, label: item.title }] : [];
      const fields = item.fields.filter(accepts).map(field => ({ key: field.key, label: field.title }));
      return fields.length > 0 ? [{ key: item.key, label: item.title, children: fields }] : [];
    });
    return children.length > 0 ? [{ key: `table:${table.key}`, label: table.title, children }] : [];
  });
}

/** The field a menu key names. */
export function fieldOfKey(tables: readonly TableNode[], key: string): DroppedField | undefined {
  for (const table of tables) {
    for (const item of table.items) {
      const fields = item.kind === 'field' ? [item] : item.fields;
      const found = fields.find(field => field.key === key);
      if (found) return found.dropped;
    }
  }
  return undefined;
}
