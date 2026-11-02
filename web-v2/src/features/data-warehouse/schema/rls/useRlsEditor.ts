import { useCallback, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useFieldArray, useForm, type Control, type FieldArrayWithId } from 'react-hook-form';
import { useDi } from '@/app/di/DiContext';
import type { JsonObject } from '@/core/json/json';
import type { RlsPolicy } from '@/core/rls/RlsPolicy';
import { RlsPolicyService } from '@/core/rls/RlsPolicyService';
import type { TableRef } from '@/core/schema/SchemaEditService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { LEAVE_CONTENT, LEAVE_TITLE, useUnsavedGuard } from '@/shared/routing/useUnsavedGuard';
import { warehouseKeys } from '../../warehouseQueries';
import { newPolicyValues, policyValuesOf, rlsFormSchema, toRlsPolicy, type RlsFormValues } from './rls.utils';

export interface RlsEditor {
  readonly control: Control<RlsFormValues>;
  readonly rows: readonly FieldArrayWithId<RlsFormValues, 'policies'>[];
  readonly onAdd: () => void;
  /** Taken out of the form only; the server deletes it on Save. */
  readonly onRemove: (index: number) => void;
  readonly onConditionsChange: (index: number, conditions: readonly JsonObject[]) => void;
  /** The row whose Custom filter is open. */
  readonly filterRow: number | undefined;
  readonly onFilterRowChange: (index: number | undefined) => void;
  readonly saving: boolean;
  readonly error: string | undefined;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

/**
 * The RLS tab in edit mode (v1 `ManageRLSPolicy` in `EditRLS`): the whole list in one form, saved as a whole with
 * `PUT policies` like the server keeps it. Policies go only in edit mode (v1 deleted in view mode too, and Cancel
 * didn't bring them back). The table's rows reload after a save, as v1 did.
 */
export function useRlsEditor(table: TableRef, policies: readonly RlsPolicy[], onDone: () => void): RlsEditor {
  const service = useDi(RlsPolicyService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const form = useForm<RlsFormValues>({ resolver: zodResolver(rlsFormSchema), defaultValues: { policies: policies.map(policyValuesOf) } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'policies' });
  const [filterRow, setFilterRow] = useState<number>();
  const dirty = form.formState.isDirty;
  useUnsavedGuard(dirty);

  const mutation = useMutation({
    mutationFn: (values: RlsFormValues) => service.put(table, values.policies.map(toRlsPolicy)),
    onSuccess: saved => {
      queryClient.setQueryData(warehouseKeys.policies(table), saved);
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.previews });
      void message.success('RLS policies saved');
      onDone();
    }
  });
  const { mutate } = mutation;

  const onConditionsChange = useCallback(
    (index: number, conditions: readonly JsonObject[]) =>
      form.setValue(`policies.${index}.conditions`, [...conditions], { shouldDirty: true, shouldValidate: form.formState.isSubmitted }),
    [form]
  );

  const onCancel = useCallback(() => {
    if (!dirty) return onDone();
    modal.confirm({ title: LEAVE_TITLE, content: LEAVE_CONTENT, okText: 'Leave', cancelText: 'Cancel', onOk: onDone });
  }, [dirty, modal, onDone]);

  return {
    control: form.control,
    rows: fields,
    onAdd: () => append(newPolicyValues()),
    onRemove: remove,
    onConditionsChange,
    filterRow,
    onFilterRowChange: setFilterRow,
    saving: mutation.isPending,
    error: mutation.isError ? toErrorMessage(mutation.error) : undefined,
    onSave: () => void form.handleSubmit(values => mutate(values))(),
    onCancel
  };
}
