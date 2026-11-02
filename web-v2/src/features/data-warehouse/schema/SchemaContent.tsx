import { Empty, Spin } from 'antd';
import { DatabasePanel } from './database-view/DatabasePanel';
import type { SchemaSelection } from './schema.utils';
import { CreateTablePanel } from './schema-edit/CreateTablePanel';
import { TablePanel } from './table-view/TablePanel';
import type { TableDraft } from './useTableDraft';

interface SchemaContentProps {
  selection: SchemaSelection;
  isLoading: boolean;
  /** A table being created in the selected database. */
  draft: TableDraft;
  onSelect: (next: SchemaSelection) => void;
  onShareDatabase: (dbName: string) => void;
}

/** The right side of the Schema page: the table being created, the selected table, else the selected database. */
export function SchemaContent({ selection, isLoading, draft, onSelect, onShareDatabase }: SchemaContentProps) {
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
  if (draft.table?.dbName === dbName) {
    return <CreateTablePanel table={draft.table} onCreated={table => onSelect({ dbName, tableName: table.name })} onCancel={draft.stop} />;
  }
  return (
    <DatabasePanel
      key={dbName}
      dbName={dbName}
      onOpenTable={name => onSelect({ dbName, tableName: name })}
      onShareDatabase={() => onShareDatabase(dbName)}
      onCreateTable={(name, displayName) => draft.start({ dbName, name, displayName })}
      onDatabaseDeleted={() => onSelect({ dbName: undefined, tableName: undefined })}
    />
  );
}
