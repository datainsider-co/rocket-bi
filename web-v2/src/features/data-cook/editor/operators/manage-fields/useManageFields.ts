import { useCallback, useMemo, useState } from 'react';
import { App } from 'antd';
import type { ExpressionFieldConfiguration, FieldConfiguration } from '@/core/data-cook/EtlOperator';
import { fieldRows, newExpressionField, type FieldRow } from '../manageFields.utils';

/** The expression dialog: a new one, or the one at `index`. */
export type ExpressionEdit = { readonly mode: 'add' } | { readonly mode: 'edit'; readonly index: number };

function replaceAt<T>(items: readonly T[], index: number, update: (item: T) => T): T[] {
  return items.map((item, at) => (at === index ? update(item) : item));
}

/**
 * Manage Fields' fields (v1 `ManageFields`): renamed, cast, hidden or shown, and expressions added, edited or removed
 * (after a confirm). `onSubmit` gets them as they are.
 */
export function useManageFields(
  initialFields: readonly FieldConfiguration[],
  initialExtraFields: readonly ExpressionFieldConfiguration[],
  onSubmit: (fields: readonly FieldConfiguration[], extraFields: readonly ExpressionFieldConfiguration[]) => void
) {
  const { modal } = App.useApp();
  const [fields, setFields] = useState(initialFields);
  const [extraFields, setExtraFields] = useState(initialExtraFields);
  const [keyword, setKeyword] = useState('');
  const [renaming, setRenaming] = useState<FieldRow>();
  const [expression, setExpression] = useState<ExpressionEdit>();

  const update = useCallback((row: Pick<FieldRow, 'kind' | 'index'>, change: { displayName?: string; asType?: string | undefined; isHidden?: boolean }) => {
    if (row.kind === 'field') setFields(current => replaceAt(current, row.index, field => ({ ...field, ...change })));
    else setExtraFields(current => replaceAt(current, row.index, field => ({ ...field, ...change })));
  }, []);

  const saveExpression = useCallback(
    (displayName: string, formula: string) => {
      if (expression?.mode === 'edit') {
        setExtraFields(current => replaceAt(current, expression.index, field => ({ ...field, displayName: displayName.trim(), expression: formula })));
      } else {
        setExtraFields(current => [...current, newExpressionField(displayName, formula, current)]);
      }
      setExpression(undefined);
    },
    [expression]
  );
  const removeExpression = useCallback(
    (index: number) =>
      void modal.confirm({
        title: 'Delete Field',
        content: `Are you sure that you want to remove the field ${extraFields[index]?.displayName ?? ''}?`,
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: () => setExtraFields(current => current.filter((_, at) => at !== index))
      }),
    [modal, extraFields]
  );

  return {
    fields,
    extraFields,
    rows: useMemo(() => fieldRows(fields, extraFields, keyword), [fields, extraFields, keyword]),
    keyword,
    setKeyword,
    setAsType: (row: FieldRow, asType: string | undefined) => update(row, { asType }),
    toggleHidden: (row: FieldRow) => update(row, { isHidden: !row.field.isHidden }),
    rename: {
      row: renaming,
      open: setRenaming,
      close: () => setRenaming(undefined),
      submit: (displayName: string) => {
        if (renaming) update(renaming, { displayName: displayName.trim() });
        setRenaming(undefined);
      }
    },
    expression: { edit: expression, open: setExpression, close: () => setExpression(undefined), save: saveExpression, remove: removeExpression },
    submit: () => onSubmit(fields, extraFields)
  };
}

export type ManageFieldsModel = ReturnType<typeof useManageFields>;
