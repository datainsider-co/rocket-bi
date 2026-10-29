import { ActionMenuView } from '@/shared/menu/ActionMenuView';
import { ColumnTypeIcon } from '@/shared/schema/ColumnTypeIcon';
import type { TreeColumn, TreeHandlers, TreeTable } from './databaseTree.utils';

interface ColumnRowViewProps {
  table: TreeTable;
  column: TreeColumn;
  handlers: TreeHandlers;
}

const ROLE_LABEL: Record<TreeColumn['role'], string | undefined> = { column: undefined, calculated: 'Calculated', measure: 'Measure' };

/** A column of an open table, with its type icon; a click hands it to the page (the Query Editor inserts it). */
export function ColumnRowView({ table, column, handlers }: ColumnRowViewProps) {
  const { onSelectColumn, columnActionsOf, onColumnAction } = handlers;
  const role = ROLE_LABEL[column.role];
  const label = (
    <span className="flex min-w-0 items-center gap-2">
      <ColumnTypeIcon type={column.type} />
      <span className="truncate">{column.title}</span>
      {role && <span className="shrink-0 text-xs text-black/45">{role}</span>}
    </span>
  );
  const row = onSelectColumn ? (
    <button
      type="button"
      className="flex w-full cursor-pointer [font-family:inherit] [font-size:inherit] rounded border-0 bg-transparent px-2 py-1 text-left text-inherit hover:bg-black/5"
      onClick={() => onSelectColumn(table, column)}
    >
      {label}
    </button>
  ) : (
    <div className="px-2 py-1">{label}</div>
  );
  const items = columnActionsOf?.(table, column) ?? [];
  if (items.length === 0 || !onColumnAction) return <li>{row}</li>;
  return (
    <li>
      <ActionMenuView items={items} target={column.title} onAction={action => onColumnAction(table, column, action)}>
        {row}
      </ActionMenuView>
    </li>
  );
}
