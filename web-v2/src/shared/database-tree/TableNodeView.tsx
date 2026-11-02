import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { ActionMenuView } from '@/shared/menu/ActionMenuView';
import { ColumnRowView } from './ColumnRowView';
import type { TreeHandlers, TreeTable } from './databaseTree.utils';
import { writeTableDrag } from './tableDrag';

interface TableNodeViewProps {
  table: TreeTable;
  open: boolean;
  selected: boolean;
  onToggle: (key: string) => void;
  handlers: TreeHandlers;
}

/**
 * A table: the caret opens it on its columns; its name selects it when the page takes tables (Schema, Query Editor),
 * else opens it too. It can be dragged out when the page asks (Relationship).
 */
export function TableNodeView({ table, open, selected, onToggle, handlers }: TableNodeViewProps) {
  const { onSelectTable, tableActionsOf, onTableAction, draggableTables } = handlers;
  const row = (
    <div
      className={`flex min-w-0 items-center rounded hover:bg-black/5 ${selected ? 'bg-black/5 font-medium' : ''}`}
      draggable={draggableTables || undefined}
      onDragStart={draggableTables ? event => writeTableDrag(event.dataTransfer, table) : undefined}
    >
      <button
        type="button"
        className="flex shrink-0 cursor-pointer border-0 bg-transparent p-1.5 text-inherit"
        aria-expanded={open}
        aria-label={`${open ? 'Close' : 'Open'} ${table.title}`}
        onClick={() => onToggle(table.key)}
      >
        {open ? <CaretDownOutlined aria-hidden /> : <CaretRightOutlined aria-hidden />}
      </button>
      <button
        type="button"
        aria-current={selected || undefined}
        className="flex min-w-0 flex-1 cursor-pointer [font-family:inherit] [font-size:inherit] items-center gap-2 border-0 bg-transparent py-1.5 pr-2 text-left text-inherit"
        onClick={() => (onSelectTable ? onSelectTable(table) : onToggle(table.key))}
      >
        <i className="di-icon-table shrink-0 text-black/60" aria-hidden />
        <span className="truncate">{table.title}</span>
      </button>
    </div>
  );
  const items = tableActionsOf?.(table) ?? [];
  return (
    <li>
      {items.length > 0 && onTableAction ? (
        <ActionMenuView items={items} target={table.title} onAction={action => onTableAction(table, action)}>
          {row}
        </ActionMenuView>
      ) : (
        row
      )}
      {open && (
        <ul className="m-0 list-none py-0 pr-0 pl-8" aria-label={`Columns of ${table.title}`}>
          {table.columns.map(column => (
            <ColumnRowView key={`${column.role}:${column.name}`} table={table} column={column} handlers={handlers} />
          ))}
        </ul>
      )}
    </li>
  );
}
