import type { EtlId } from '@/core/data-cook/EtlJob';
import type { ExpressionFieldConfiguration, FieldConfiguration } from '@/core/data-cook/EtlOperator';
import type { TableSchema } from '@/core/schema/SchemaService';
import { ManageFieldsDialogView } from './ManageFieldsDialogView';
import { useFieldsSample } from './useFieldsSample';
import { useManageFields } from './useManageFields';

interface ManageFieldsFormDialogProps {
  texts: { title: string; okText: string };
  etlId: EtlId;
  table: TableSchema;
  initial: { fields: readonly FieldConfiguration[]; extraFields: readonly ExpressionFieldConfiguration[] };
  onSubmit: (fields: readonly FieldConfiguration[], extraFields: readonly ExpressionFieldConfiguration[]) => void;
  onCancel: () => void;
}

/** The dialog on its fields; mounted once per dialog, so they start from the operator edited. */
export function ManageFieldsFormDialog({ texts, etlId, table, initial, onSubmit, onCancel }: ManageFieldsFormDialogProps) {
  const model = useManageFields(initial.fields, initial.extraFields, onSubmit);
  const sample = useFieldsSample(etlId, model.fields, model.extraFields);
  return <ManageFieldsDialogView texts={texts} table={table} model={model} sample={sample} onCancel={onCancel} />;
}
