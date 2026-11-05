import type { EtlGraph } from '@/core/data-cook/etlGraph';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import type { TablePreviewState } from '../../preview/useEtlPreview';
import { dialogTexts, knownTable, newTableConfig, type OperatorDialog } from '../operators.utils';
import { defaultSql, newSqlOperator, withoutDatabase } from '../sqlQuery.utils';
import { SqlQueryFormDialog } from './SqlQueryFormDialog';

interface SqlQueryDialogProps {
  dialog: OperatorDialog;
  graph: EtlGraph;
  previews: ReadonlyMap<string, TablePreviewState>;
  /** `preview_etl_<id>`. */
  dbName: string;
  onAdd: (operator: EtlOperator, parentNames: readonly string[]) => void;
  onUpdate: (operator: EtlOperator) => void;
  onCancel: () => void;
}

/** SQL Query after a table, or an SQL Query edited: its SQL on the table it reads. */
export function SqlQueryDialog({ dialog, graph, previews, dbName, onAdd, onUpdate, onCancel }: SqlQueryDialogProps) {
  const editing = dialog.mode === 'edit' ? graph.operators.get(dialog.tblName) : undefined;
  const parentName = dialog.mode === 'add' ? dialog.parent : (graph.parentNames.get(dialog.tblName)?.[0] ?? '');
  const parent = graph.operators.get(parentName);
  if (!parent || (dialog.mode === 'edit' && editing?.kind !== 'sql')) return null;

  const table = knownTable(previews, parent, dbName);
  const initialSql = editing?.kind === 'sql' ? withoutDatabase(editing.query, dbName) : defaultSql(table);
  const submit = (query: string) => {
    if (editing?.kind === 'sql') onUpdate({ ...editing, query });
    else onAdd(newSqlOperator(parent, newTableConfig(graph, [parent]), query), [parentName]);
  };
  return <SqlQueryFormDialog texts={dialogTexts(dialog)} table={table} initialSql={initialSql} onSubmit={submit} onCancel={onCancel} />;
}
