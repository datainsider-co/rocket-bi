import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useDi } from '@/app/di/DiContext';
import { SchemaEditService, type ExpressionColumnKind } from '@/core/schema/SchemaEditService';
import type { SchemaColumn, TableSchema } from '@/core/schema/SchemaService';
import { expressionColumnOf, expressionOf, formulaFieldSchema, formulaFieldValuesOf, takenNamesOf, type FormulaFieldValues } from './fieldActions.utils';

export interface FormulaFieldTarget {
  readonly kind: ExpressionColumnKind;
  readonly table: TableSchema;
  /** The measure or calculated column edited; none to create one. */
  readonly editing?: SchemaColumn;
}

/**
 * The formula dialog's form and its saving (v1 `CalculatedFieldModal.create*` / `edit*` with
 * `DatabaseSchemaStore`): the server checks the expression and gives its type, then the column is created or replaced.
 * A failure shows the server's message under the editor.
 */
export function useFormulaFieldForm({ kind, table, editing }: FormulaFieldTarget, onSaved: (table: TableSchema) => void) {
  const edit = useDi(SchemaEditService);
  const schema = useMemo(() => formulaFieldSchema(editing ? undefined : takenNamesOf(table)), [editing, table]);
  const form = useForm<FormulaFieldValues>({ resolver: zodResolver(schema), defaultValues: formulaFieldValuesOf(kind, table, editing) });
  const mutation = useMutation({
    mutationFn: async (values: FormulaFieldValues) => {
      const expression = expressionOf(kind, table, values.formula);
      const type = await edit.detectExpressionType(table, kind, expression);
      const column = expressionColumnOf(kind, values, expression, type, editing);
      return editing ? edit.updateColumn(table, kind, column) : edit.createColumn(table, kind, column);
    },
    onSuccess: onSaved
  });
  return {
    control: form.control,
    saving: mutation.isPending,
    error: mutation.error?.message,
    onSubmit: () => void form.handleSubmit(values => mutation.mutate(values))()
  };
}
