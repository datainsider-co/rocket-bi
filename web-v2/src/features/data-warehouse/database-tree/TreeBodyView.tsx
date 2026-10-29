import { Button, Spin } from 'antd';
import { DatabaseNodeView } from './DatabaseNodeView';
import { isDatabaseOpen, type TreeHandlers, type TreeSelection } from './databaseTree.utils';
import { TableNodeView } from './TableNodeView';
import type { DatabaseTreeData } from './useDatabaseTreeData';
import type { TreeExpansion } from './useTreeExpansion';

interface TreeBodyViewProps {
  data: DatabaseTreeData;
  expansion: TreeExpansion;
  selection: TreeSelection;
  handlers: TreeHandlers;
  onDatabaseClick: (name: string) => void;
  /** A search is typed in: an empty result says nothing matched rather than that there is nothing. */
  searching: boolean;
}

/** The databases, each with its tables while open; or loading, an error with Retry, or why the tree is empty. */
export function TreeBodyView({ data, expansion, selection, handlers, onDatabaseClick, searching }: TreeBodyViewProps) {
  if (data.status === 'loading') return <Spin className="mt-6 block" />;
  if (data.status === 'error') {
    return (
      <div className="m-4 flex flex-col items-start gap-2">
        <p className="m-0 text-[var(--ant-color-error,#ff4d4f)]">{data.error}</p>
        <Button size="small" onClick={data.refresh}>
          Retry
        </Button>
      </div>
    );
  }
  if (data.databases.length === 0) {
    return <p className="m-4 text-black/45">{searching ? 'No databases or tables match' : 'No databases'}</p>;
  }
  return (
    <ul className="m-0 list-none p-0 pb-2" aria-label="Databases">
      {data.databases.map(database => (
        <DatabaseNodeView
          key={database.name}
          database={database}
          open={isDatabaseOpen(database, expansion.openDatabases)}
          selected={selection.dbName === database.name && !selection.tableName}
          loading={data.loading.has(database.name)}
          error={data.errors.get(database.name)}
          onClick={onDatabaseClick}
        >
          {database.tables?.map(table => (
            <TableNodeView
              key={table.key}
              table={table}
              open={expansion.openTables.has(table.key)}
              selected={selection.dbName === table.dbName && selection.tableName === table.name}
              onToggle={expansion.toggleTable}
              handlers={handlers}
            />
          ))}
        </DatabaseNodeView>
      ))}
    </ul>
  );
}
