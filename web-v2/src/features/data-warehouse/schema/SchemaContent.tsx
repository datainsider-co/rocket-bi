import { Empty, Spin } from 'antd';
import { DatabasePanel } from './database-view/DatabasePanel';
import type { SchemaSelection } from './schema.utils';
import { TablePanel } from './table-view/TablePanel';

interface SchemaContentProps {
  selection: SchemaSelection;
  isLoading: boolean;
  onSelect: (next: SchemaSelection) => void;
  onShareDatabase: (dbName: string) => void;
}

/** The right side of the Schema page: the selected table, else the selected database, else why there is none. */
export function SchemaContent({ selection, isLoading, onSelect, onShareDatabase }: SchemaContentProps) {
  const { dbName, tableName } = selection;
  if (isLoading) return <Spin className="mt-12 block" />;
  if (!dbName) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg bg-white">
        <Empty description="No database yet" />
      </div>
    );
  }
  if (tableName) {
    return <TablePanel key={`${dbName}.${tableName}`} dbName={dbName} tableName={tableName} onOpenDatabase={() => onSelect({ dbName, tableName: undefined })} />;
  }
  return (
    <DatabasePanel
      key={dbName}
      dbName={dbName}
      onOpenTable={name => onSelect({ dbName, tableName: name })}
      onShareDatabase={() => onShareDatabase(dbName)}
      onDatabaseDeleted={() => onSelect({ dbName: undefined, tableName: undefined })}
    />
  );
}
