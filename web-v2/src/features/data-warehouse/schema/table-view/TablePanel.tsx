import { useNavigate } from 'react-router';
import { useDeleteTable } from '../useDeleteTable';
import { queryTablePath, updateByQueryPath } from '../schema.utils';
import { TablePanelView } from './TablePanelView';
import { useTablePanel } from './useTablePanel';

interface TablePanelProps {
  dbName: string;
  tableName: string;
  /** Back to the database's view: its name was clicked, or the table was deleted. */
  onOpenDatabase: () => void;
}

/** The selected table. Query table and Update schema by query open the Query Editor, as in v1. */
export function TablePanel({ dbName, tableName, onOpenDatabase }: TablePanelProps) {
  const data = useTablePanel({ dbName, name: tableName });
  const navigate = useNavigate();
  const deleteTable = useDeleteTable(onOpenDatabase);
  const { table } = data;
  const actions = {
    onOpenDatabase,
    onQueryTable: () => void navigate(queryTablePath({ dbName, name: tableName })),
    onUpdateByQuery: () => table && void navigate(updateByQueryPath(table)),
    onDeleteTable: () => deleteTable({ dbName, name: tableName, displayName: table?.displayName ?? tableName })
  };
  return <TablePanelView dbName={dbName} data={data} actions={actions} />;
}
