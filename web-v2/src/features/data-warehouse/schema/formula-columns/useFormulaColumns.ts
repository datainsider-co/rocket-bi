import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { SchemaEditService, type ExpressionColumnKind } from '@/core/schema/SchemaEditService';
import type { SchemaColumn, TableSchema } from '@/core/schema/SchemaService';
import { deleteColumnMessage } from '@/features/chart-builder/field-actions/fieldActions.utils';
import type { FormulaFieldTarget } from '@/features/chart-builder/field-actions/useFormulaFieldForm';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { warehouseKeys } from '../../warehouseQueries';

/** What the tree and the Measure / Calculated Field tabs do with a table's formulas. */
export interface FormulaColumnActions {
  readonly onAdd: (kind: ExpressionColumnKind, table: TableSchema) => void;
  readonly onEdit: (kind: ExpressionColumnKind, table: TableSchema, column: SchemaColumn) => void;
  readonly onDelete: (kind: ExpressionColumnKind, table: TableSchema, column: SchemaColumn) => void;
}

export interface FormulaColumns {
  readonly actions: FormulaColumnActions;
  /** The open formula dialog, if any. */
  readonly dialog: FormulaFieldTarget | undefined;
  readonly onSaved: (table: TableSchema) => void;
  readonly onCancel: () => void;
}

/**
 * Measures and calculated columns of the Schema page: the CB8 formula dialog they open, the deletions they confirm,
 * and the reload of the table and its database after each change (v1 reloaded the database only).
 */
export function useFormulaColumns(): FormulaColumns {
  const edit = useDi(SchemaEditService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const [dialog, setDialog] = useState<FormulaFieldTarget>();

  const refresh = useCallback(
    (table: Pick<TableSchema, 'dbName' | 'name'>) => {
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.table(table) });
      void queryClient.invalidateQueries({ queryKey: schemaKeys.database(table.dbName) });
    },
    [queryClient]
  );

  const actions = useMemo(
    (): FormulaColumnActions => ({
      onAdd: (kind, table) => setDialog({ kind, table }),
      onEdit: (kind, table, column) => setDialog({ kind, table, editing: column }),
      onDelete: (kind, table, column) =>
        void modal.confirm({
          title: 'Delete',
          content: deleteColumnMessage(kind, column),
          okText: 'Delete',
          okButtonProps: { danger: true },
          onOk: async () => {
            try {
              await edit.deleteColumn(table, kind, column.name);
            } catch (error) {
              void message.error(`Can not delete column ${column.displayName}: ${toErrorMessage(error)}`);
              return;
            }
            refresh(table);
          }
        })
    }),
    [edit, modal, message, refresh]
  );

  const onSaved = useCallback(
    (table: TableSchema) => {
      setDialog(undefined);
      refresh(table);
    },
    [refresh]
  );
  const onCancel = useCallback(() => setDialog(undefined), []);

  return { actions, dialog, onSaved, onCancel };
}
