import { DeleteOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, Input, Spin, Table, Tooltip, Typography } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { DatabasePanelData } from './useDatabasePanel';

export interface DatabasePanelActions {
  readonly onOpenTable: (table: TableSchema) => void;
  readonly onDeleteTable: (table: TableSchema) => void;
  readonly onShareDatabase: () => void;
  readonly onDeleteDatabase: () => void;
}

interface DatabasePanelViewProps {
  dbName: string;
  data: DatabasePanelData;
  actions: DatabasePanelActions;
}

const tableTitle = (table: TableSchema) => table.displayName || table.name;

/** A database's view (v1 `TableManagement`): its tables, a search, and the database's Action menu. */
export function DatabasePanelView({ dbName, data, actions }: DatabasePanelViewProps) {
  const menu = {
    items: [
      { key: 'share', label: 'Share Database' },
      { key: 'delete', label: 'Delete Database', danger: true }
    ],
    onClick: ({ key }: { key: string }) => (key === 'share' ? actions.onShareDatabase() : actions.onDeleteDatabase())
  };
  return (
    <section aria-label={`Database ${dbName}`} className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="m-0 flex min-w-0 flex-1 items-center gap-2 text-base font-medium">
          <i className="di-icon-database text-black/60" aria-hidden />
          <span className="truncate">{dbName}</span>
        </h2>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search tables..."
          aria-label="Search tables"
          className="w-56 max-sm:w-full"
          value={data.searchText}
          onChange={event => data.onSearchChange(event.target.value)}
        />
        <Dropdown menu={menu} trigger={['click']}>
          <Button type="text" icon={<SettingOutlined />}>
            Action
          </Button>
        </Dropdown>
      </header>
      {data.status === 'loading' && <Spin className="mt-8 block" />}
      {data.status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Typography.Text type="danger">{data.error}</Typography.Text>
          <Button onClick={data.retry}>Retry</Button>
        </div>
      )}
      {data.status === 'ready' && (
        <div className="min-h-0 flex-1 overflow-auto">
          <Table<TableSchema>
            rowKey="name"
            dataSource={[...data.tables]}
            pagination={false}
            locale={{ emptyText: data.total === 0 ? 'This database has no tables' : 'No tables found' }}
            onRow={table => ({ onClick: () => actions.onOpenTable(table), className: 'cursor-pointer' })}
            columns={[
              {
                key: 'name',
                title: 'Name',
                ellipsis: true,
                render: (_, table) => (
                  <span className="flex min-w-0 items-center gap-2" title={table.name}>
                    <i className="di-icon-table shrink-0 text-black/60" aria-hidden />
                    <span className="truncate">{tableTitle(table)}</span>
                  </span>
                )
              },
              { key: 'type', title: 'Type', width: 120, responsive: ['sm'], render: (_, table) => (table.tableType === 'view' ? 'View' : 'Table') },
              { key: 'columns', title: 'Columns', width: 100, responsive: ['sm'], render: (_, table) => table.columns.length },
              {
                key: 'action',
                title: 'Action',
                width: 90,
                render: (_, table) => (
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={`Delete ${tableTitle(table)}`}
                      onClick={event => {
                        // The row opens the table; the button must not.
                        event.stopPropagation();
                        actions.onDeleteTable(table);
                      }}
                    />
                  </Tooltip>
                )
              }
            ]}
          />
        </div>
      )}
    </section>
  );
}
