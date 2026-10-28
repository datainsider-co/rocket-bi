import type { TableSchema } from '@/core/schema/SchemaService';
import { FormulaFieldDialog } from './FormulaFieldDialog';
import { UpdateTableQueryDialog } from './UpdateTableQueryDialog';
import type { FieldDialog } from './useFieldActions';
import type { ViewQueryUpdate } from './updateViewQuery';

export interface FieldActionDialogProps {
  dialog?: FieldDialog;
  /** The tree database's tables, suggested in a query. */
  tables: readonly TableSchema[];
  onClose: () => void;
  onFormulaSaved: (table: TableSchema) => void;
  onQuerySaved: (update: ViewQueryUpdate) => void;
}

/** The dialog a field tree action opened, if any. */
export function FieldActionDialog({ dialog, tables, onClose, onFormulaSaved, onQuerySaved }: FieldActionDialogProps) {
  if (!dialog) return null;
  if (dialog.type === 'formula') return <FormulaFieldDialog target={dialog.target} onSaved={onFormulaSaved} onCancel={onClose} />;
  return <UpdateTableQueryDialog table={dialog.table} tables={tables} onSaved={onQuerySaved} onCancel={onClose} />;
}
