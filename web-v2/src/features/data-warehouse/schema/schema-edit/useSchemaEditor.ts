import { useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useFieldArray, useForm, type Control, type FieldArrayWithId } from 'react-hook-form';
import { useDi } from '@/app/di/DiContext';
import { newTable, type TableDefinition } from '@/core/schema/TableDefinition';
import { TableService } from '@/core/schema/TableService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { LEAVE_CONTENT, LEAVE_TITLE, useUnsavedGuard } from '../../useUnsavedGuard';
import { warehouseKeys } from '../../warehouseQueries';
import {
  changesType,
  newColumnValues,
  schemaFormSchema,
  schemaFormValuesOf,
  takenColumnNames,
  toColumnDefinitions,
  TYPE_CHANGE_MESSAGE,
  withType,
  type NewTableName,
  type SchemaFormValues
} from './schemaEdit.utils';

/** The columns of a table to edit, or of one to create (v1 `FieldManagement` in EditSchema or CreateTable mode). */
export type SchemaEditTarget = { readonly kind: 'edit'; readonly table: TableDefinition } | { readonly kind: 'create'; readonly table: NewTableName };

export interface SchemaEditor {
  readonly mode: SchemaEditTarget['kind'];
  readonly control: Control<SchemaFormValues>;
  readonly rows: readonly FieldArrayWithId<SchemaFormValues, 'columns'>[];
  readonly onAddColumn: () => void;
  /** Only new columns can go: the server keeps a table's columns. */
  readonly onRemoveColumn: (index: number) => void;
  readonly onTypeChange: (index: number, type: string) => void;
  readonly saving: boolean;
  /** The server's message when saving failed; the form keeps what was typed. */
  readonly error: string | undefined;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

/**
 * The column form and its save: `PUT databases/{db}/tables/{tbl}` (after v1's confirm when a type changes) or
 * `POST databases/{db}/tables`. The form stays as typed when the save fails (v1 left edit mode first and lost it);
 * leaving with changes asks first.
 */
export function useSchemaEditor(target: SchemaEditTarget, onSaved: (table: TableDefinition) => void, onCancel: () => void): SchemaEditor {
  const service = useDi(TableService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const original = useMemo(() => (target.kind === 'edit' ? target.table.columns : []), [target]);
  const schema = useMemo(() => schemaFormSchema(target.kind === 'edit' ? takenColumnNames(target.table) : new Set<string>()), [target]);
  const form = useForm<SchemaFormValues>({ resolver: zodResolver(schema), defaultValues: schemaFormValuesOf(original) });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'columns' });
  // A table being created is lost on leaving, typed into or not.
  const dirty = target.kind === 'create' || form.formState.isDirty;
  const release = useUnsavedGuard(dirty);

  const mutation = useMutation({
    mutationFn: (values: SchemaFormValues) => {
      if (target.kind === 'edit') return service.updateTable({ ...target.table, columns: toColumnDefinitions(values, original) });
      const { dbName, name, displayName } = target.table;
      return service.createTable(newTable(dbName, name, displayName, toColumnDefinitions(values, [])));
    },
    onSuccess: async saved => {
      queryClient.setQueryData(warehouseKeys.table(saved), saved);
      await queryClient.invalidateQueries({ queryKey: schemaKeys.database(saved.dbName) });
      void message.success(target.kind === 'edit' ? `Table ${saved.displayName} saved` : `Table ${saved.displayName} created`);
      release();
      onSaved(saved);
    }
  });
  const { mutate, mutateAsync } = mutation;

  const onSave = useCallback(() => {
    void form.handleSubmit(values => {
      if (!changesType(values, original)) return mutate(values);
      modal.confirm({ title: 'Change column type', content: TYPE_CHANGE_MESSAGE, okText: 'Save', onOk: () => mutateAsync(values).catch(() => undefined) });
    })();
  }, [form, original, modal, mutate, mutateAsync]);

  const cancel = useCallback(() => {
    if (!dirty) return onCancel();
    modal.confirm({ title: LEAVE_TITLE, content: LEAVE_CONTENT, okText: 'Leave', cancelText: 'Cancel', onOk: onCancel });
  }, [dirty, modal, onCancel]);

  const onTypeChange = useCallback(
    (index: number, type: string) => {
      const row = withType(form.getValues(`columns.${index}`), type);
      form.setValue(`columns.${index}.type`, row.type, { shouldDirty: true });
      form.setValue(`columns.${index}.defaultValue`, row.defaultValue, { shouldDirty: true });
    },
    [form]
  );

  return {
    mode: target.kind,
    control: form.control,
    rows: fields,
    onAddColumn: () => append(newColumnValues()),
    onRemoveColumn: remove,
    onTypeChange,
    saving: mutation.isPending,
    error: mutation.isError ? toErrorMessage(mutation.error) : undefined,
    onSave,
    onCancel: cancel
  };
}
