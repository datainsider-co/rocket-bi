import { RightOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import type { TableDefinition } from '@/core/schema/TableDefinition';
import { canUpdateByQuery } from '../schema.utils';

export interface TableActions {
  readonly onOpenDatabase: () => void;
  readonly onQueryTable: () => void;
  readonly onUpdateByQuery: () => void;
  readonly onDeleteTable: () => void;
}

/** "database › table" with the database clickable, and the table's Action menu (v1 `DataSchema` header). */
export function TablePanelHeader({ dbName, table, actions }: { dbName: string; table: TableDefinition | undefined; actions: TableActions }) {
  const items = [
    { key: 'query', label: 'Query table' },
    ...(table && canUpdateByQuery(table) ? [{ key: 'update', label: 'Update schema by query' }] : []),
    { key: 'delete', label: 'Delete table', danger: true }
  ];
  const handlers: Record<string, () => void> = { query: actions.onQueryTable, update: actions.onUpdateByQuery, delete: actions.onDeleteTable };
  return (
    <header className="mb-3 flex flex-wrap items-center gap-2">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 text-base">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 [font-family:inherit] text-base font-medium text-inherit hover:text-[var(--color-brand)]"
          onClick={actions.onOpenDatabase}
        >
          <i className="di-icon-database text-black/60" aria-hidden />
          {dbName}
        </button>
        <RightOutlined className="text-xs text-black/45" aria-hidden />
        <span className="truncate" aria-current="page">
          {table?.displayName}
        </span>
      </nav>
      <Dropdown menu={{ items, onClick: ({ key }) => handlers[key]?.() }} trigger={['click']} disabled={!table}>
        <Button type="text" icon={<SettingOutlined />}>
          Action
        </Button>
      </Dropdown>
    </header>
  );
}
