import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { asString, type JsonObject } from '@/core/json/json';
import { SchemaEditService } from '@/core/schema/SchemaEditService';
import { SchemaService, type TableSchema } from '@/core/schema/SchemaService';
import { databaseQueryOptions } from '@/shared/schema/schemaQueries';
import { columnNameOfNode, expressionKindOf, type FieldNode, type TreeActions } from '../field-tree/fieldTree.utils';
import type { TableRef } from '../state/tableSync.utils';
import { columnsOfKind, deleteColumnMessage, lostColumnsMessage, tableActionsOf, type ColumnAction, type TableAction } from './fieldActions.utils';
import type { FormulaFieldTarget } from './useFormulaFieldForm';
import { useTableRefresh } from './useTableRefresh';
import type { ViewQueryUpdate } from './updateViewQuery';

/** The dialog an action opened. */
export type FieldDialog = { readonly type: 'formula'; readonly target: FormulaFieldTarget } | { readonly type: 'query'; readonly table: TableSchema };

export interface FieldActionsInput {
  /** An ad hoc chart's builder has no actions (v1 `hideTableAction`). */
  readonly disabled: boolean;
  /** The tables of the tree's database; none while they load. */
  readonly tables?: readonly TableSchema[];
  /** Opens a table of the tree, to show the column just added. */
  readonly onExpand: (tableName: string) => void;
}

/**
 * The actions on the field tree's tables, measures and calculated columns (v1 `DatabaseListing` menus), and Edit
 * Measure from a builder item: the dialog they open, the deletions they confirm, and the reload after each change.
 */
export function useFieldActions({ disabled, tables, onExpand }: FieldActionsInput) {
  const edit = useDi(SchemaEditService);
  const schema = useDi(SchemaService);
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const refresh = useTableRefresh();
  const [dialog, setDialog] = useState<FieldDialog>();

  const confirmDelete = useCallback(
    (table: TableRef, content: string, run: () => Promise<void>, failure: (error: Error) => string) =>
      void modal.confirm({
        title: 'Delete',
        content,
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await run();
          } catch (error) {
            void message.error(failure(error instanceof Error ? error : new Error(String(error))));
            return;
          }
          await refresh(table);
        }
      }),
    [modal, message, refresh]
  );

  const tree = useMemo((): TreeActions | undefined => {
    if (disabled || !tables) return undefined;
    const tableOf = (name: string) => tables.find(table => table.name === name);
    const onTableAction = (key: string, action: TableAction) => {
      const table = tableOf(key);
      if (!table) return;
      if (action === 'addCalculated' || action === 'addMeasure') setDialog({ type: 'formula', target: { kind: action === 'addMeasure' ? 'measure' : 'calculated', table } });
      else setDialog({ type: 'query', table });
    };
    const onColumnAction = (node: FieldNode, action: ColumnAction) => {
      const kind = expressionKindOf(node);
      const table = tableOf(asString(node.dropped.field['tbl_name']));
      const column = kind && table && columnsOfKind(table, kind).find(item => item.name === columnNameOfNode(node));
      if (!kind || !table || !column) return;
      if (action === 'edit') setDialog({ type: 'formula', target: { kind, table, editing: column } });
      else confirmDelete(table, deleteColumnMessage(kind, column), () => edit.deleteColumn(table, kind, column.name), () => `Can not delete column ${column.displayName}`);
    };
    return { tableActionsOf: key => tableActionsOf(tableOf(key) ?? { dbName: '' }), onTableAction, onColumnAction };
  }, [disabled, tables, confirmDelete, edit]);

  // v1 `ConfigDraggable.editExpression`. The item's database may not be the one the tree shows.
  const openMeasure = useCallback(
    async (field: JsonObject) => {
      const database = await queryClient.ensureQueryData(databaseQueryOptions(schema, asString(field['db_name']))).catch(() => undefined);
      const table = database?.tables.find(item => item.name === field['tbl_name']);
      const column = table?.expressionColumns?.find(item => item.name === field['field_name']);
      if (table && column) setDialog({ type: 'formula', target: { kind: 'measure', table, editing: column } });
      else void message.error('This measure is no longer in its table');
    },
    [queryClient, schema, message]
  );
  const editMeasure = useMemo(() => (disabled ? undefined : (field: JsonObject) => void openMeasure(field)), [disabled, openMeasure]);

  const onClose = useCallback(() => setDialog(undefined), []);
  const onFormulaSaved = useCallback(
    (table: TableSchema) => {
      setDialog(undefined);
      onExpand(table.name);
      void refresh(table);
    },
    [onExpand, refresh]
  );
  const onQuerySaved = useCallback(
    ({ table, lost }: ViewQueryUpdate) => {
      setDialog(undefined);
      if (lost.length > 0) void message.warning(lostColumnsMessage(lost));
      onExpand(table.name);
      void refresh(table);
    },
    [message, onExpand, refresh]
  );

  return {
    tree,
    editMeasure,
    dialogs: { dialog, tables: tables ?? [], onClose, onFormulaSaved, onQuerySaved }
  };
}
