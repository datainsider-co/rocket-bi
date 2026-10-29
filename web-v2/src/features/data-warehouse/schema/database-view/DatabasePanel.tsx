import type { TableSchema } from '@/core/schema/SchemaService';
import { useDeleteDatabase } from '../../databases/useDeleteDatabase';
import { useDeleteTable } from '../useDeleteTable';
import { DatabasePanelView } from './DatabasePanelView';
import { useDatabasePanel } from './useDatabasePanel';

interface DatabasePanelProps {
  dbName: string;
  onOpenTable: (tableName: string) => void;
  onShareDatabase: () => void;
  /** The database is gone; the page shows another. */
  onDatabaseDeleted: () => void;
}

/** The selected database, without a table selected (v1 `ViewDatabase`). */
export function DatabasePanel({ dbName, onOpenTable, onShareDatabase, onDatabaseDeleted }: DatabasePanelProps) {
  const data = useDatabasePanel(dbName);
  const deleteTable = useDeleteTable();
  const deleteDatabase = useDeleteDatabase(onDatabaseDeleted);
  const actions = {
    onOpenTable: (table: TableSchema) => onOpenTable(table.name),
    onDeleteTable: (table: TableSchema) => deleteTable({ dbName, name: table.name, displayName: table.displayName || table.name }),
    onShareDatabase,
    onDeleteDatabase: () => deleteDatabase({ name: dbName, displayName: dbName })
  };
  return <DatabasePanelView dbName={dbName} data={data} actions={actions} />;
}
