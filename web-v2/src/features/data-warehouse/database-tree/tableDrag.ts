import type { TableRef } from '@/core/schema/SchemaEditService';

/**
 * A table dragged out of the tree (HTML drag and drop, v1's `drop_table`), dropped on the Relationship canvas. The
 * table travels as JSON under its own type, so other drags (text, files) are not mistaken for one.
 */
export const TABLE_DRAG_TYPE = 'application/x-rocketbi-table';

type DragData = Pick<DataTransfer, 'setData' | 'getData' | 'types'>;

export function writeTableDrag(data: DragData, table: TableRef): void {
  data.setData(TABLE_DRAG_TYPE, JSON.stringify({ dbName: table.dbName, name: table.name }));
}

/** Whether the drag carries a table: `getData` is empty until the drop, but the type is known while dragging over. */
export function isTableDrag(data: Pick<DataTransfer, 'types'>): boolean {
  return Array.from(data.types).includes(TABLE_DRAG_TYPE);
}

export function readTableDrag(data: DragData): TableRef | undefined {
  if (!isTableDrag(data)) return undefined;
  try {
    const value: unknown = JSON.parse(data.getData(TABLE_DRAG_TYPE));
    if (typeof value !== 'object' || value === null) return undefined;
    const { dbName, name } = value as Record<string, unknown>;
    return typeof dbName === 'string' && typeof name === 'string' ? { dbName, name } : undefined;
  } catch {
    return undefined;
  }
}
