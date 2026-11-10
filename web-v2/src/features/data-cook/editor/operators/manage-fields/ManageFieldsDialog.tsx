import type { EtlGraph } from '@/core/data-cook/etlGraph';
import type { EtlId } from '@/core/data-cook/EtlJob';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import type { TablePreviewState } from '../../preview/useEtlPreview';
import { fieldsOfTable, mergeFields, newManageFieldsOperator } from '../manageFields.utils';
import { dialogTexts, knownTable, newTableConfig, type OperatorDialog } from '../operators.utils';
import { ManageFieldsFormDialog } from './ManageFieldsFormDialog';

interface ManageFieldsDialogProps {
  dialog: OperatorDialog;
  etlId: EtlId;
  graph: EtlGraph;
  previews: ReadonlyMap<string, TablePreviewState>;
  dbName: string;
  onAdd: (operator: EtlOperator, parentNames: readonly string[]) => void;
  onUpdate: (operator: EtlOperator) => void;
  onCancel: () => void;
}

/**
 * Manage Fields after a table, with every column of it; or edited, its fields on the table's columns now (v1
 * `mergeFields`). Without the table's preview, an edited operator keeps its fields as saved.
 */
export function ManageFieldsDialog({ dialog, etlId, graph, previews, dbName, onAdd, onUpdate, onCancel }: ManageFieldsDialogProps) {
  const editing = dialog.mode === 'edit' ? graph.operators.get(dialog.tblName) : undefined;
  const parentName = dialog.mode === 'add' ? dialog.parent : (graph.parentNames.get(dialog.tblName)?.[0] ?? '');
  const parent = graph.operators.get(parentName);
  if (!parent || (dialog.mode === 'edit' && editing?.kind !== 'manageFields')) return null;

  const table = knownTable(previews, parent, dbName);
  const fromTable = fieldsOfTable(table);
  const initial =
    editing?.kind === 'manageFields'
      ? { fields: table.columns.length > 0 ? mergeFields(fromTable, editing.fields) : editing.fields, extraFields: editing.extraFields }
      : { fields: fromTable, extraFields: [] };
  const submit: Parameters<typeof ManageFieldsFormDialog>[0]['onSubmit'] = (fields, extraFields) => {
    if (editing?.kind === 'manageFields') onUpdate({ ...editing, fields, extraFields });
    else onAdd(newManageFieldsOperator(parent, newTableConfig(graph, [parent]), fields, extraFields), [parentName]);
  };
  return <ManageFieldsFormDialog texts={dialogTexts(dialog)} etlId={etlId} table={table} initial={initial} onSubmit={submit} onCancel={onCancel} />;
}
