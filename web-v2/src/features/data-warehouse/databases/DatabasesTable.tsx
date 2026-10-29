import { Table } from 'antd';
import type { DatabaseEntry } from '@/core/schema/DatabaseService';
import { databaseColumns, type DatabaseRowActions } from './databaseColumns';
import { DATABASE_PAGE_SIZES } from './databases.utils';

interface DatabasesTableProps {
  rows: readonly DatabaseEntry[];
  isFetching: boolean;
  actions: DatabaseRowActions;
  /** A row was clicked: the page opens the database. */
  onOpen: (entry: DatabaseEntry) => void;
}

const rowKey = (entry: DatabaseEntry) => entry.name;

/** Every database, sorted and paged in the browser; a row opens the database on the Schema page (v1). */
export function DatabasesTable({ rows, isFetching, actions, onOpen }: DatabasesTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <Table<DatabaseEntry>
        rowKey={rowKey}
        columns={databaseColumns(actions)}
        dataSource={[...rows]}
        loading={isFetching}
        showSorterTooltip={false}
        onRow={entry => ({ onClick: () => onOpen(entry), className: 'cursor-pointer' })}
        pagination={{
          defaultPageSize: DATABASE_PAGE_SIZES[0],
          showSizeChanger: true,
          pageSizeOptions: [...DATABASE_PAGE_SIZES],
          showTotal: total => `Total: ${total}`
        }}
      />
    </div>
  );
}
