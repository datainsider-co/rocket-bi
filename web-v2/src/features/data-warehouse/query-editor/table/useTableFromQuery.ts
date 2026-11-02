import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import type { QueryParameter } from '@/core/query/queryParameters';
import { SchemaEditService } from '@/core/schema/SchemaEditService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { TableService } from '@/core/schema/TableService';
import { updateViewQuery } from '@/features/chart-builder/field-actions/updateViewQuery';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { selectionToParams } from '../../schema/schema.utils';
import { getWarehouseSection, WarehouseSection } from '../../warehouse.utils';
import { tableQueryOf, toTableFromQuery, type TableFromQueryForm } from './tableFromQuery.utils';

export interface TableFromQuery {
  /** Create Table: the dialog, open on the SQL it will make the table of. */
  readonly creating: { readonly query: string; readonly pending: boolean; readonly error: string | undefined } | undefined;
  readonly onCreate: (sql: string, parameters: readonly QueryParameter[]) => void;
  readonly onCreateSubmit: (form: TableFromQueryForm) => void;
  readonly onCreateCancel: () => void;
  /** Update Table, for the view whose query is edited (`?mode=update`). */
  readonly onUpdate: ((sql: string, parameters: readonly QueryParameter[]) => void) | undefined;
  readonly updating: boolean;
}

const schemaPathOf = (dbName: string, tableName: string) => `${getWarehouseSection(WarehouseSection.Schema).path}?${selectionToParams({ dbName, tableName })}`;

/**
 * A table of the query (v1 Actions › Create Table, and Update Table of `?mode=update`). A created table appears in the
 * tree and the editor stays (v1 went to the Schema page, leaving the query); an updated view opens on the Schema page,
 * as in v1, its measures and calculated columns made again on the new query (`updateViewQuery`, CB8).
 */
export function useTableFromQuery(view: TableSchema | undefined, release: () => void): TableFromQuery {
  const tables = useDi(TableService);
  const edits = useDi(SchemaEditService);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [query, setQuery] = useState<string>();

  const create = useMutation({
    mutationFn: (form: TableFromQueryForm) => tables.createTableFromQuery(toTableFromQuery(form, query ?? '')),
    onSuccess: table => {
      setQuery(undefined);
      void queryClient.invalidateQueries({ queryKey: schemaKeys.database(table.dbName) });
      void message.success(`Table ${table.dbName}.${table.name} created`);
    }
  });
  const update = useMutation({
    mutationFn: ({ table, sql }: { table: TableSchema; sql: string }) => updateViewQuery(edits, table, sql),
    onSuccess: ({ table, lost }) => {
      void queryClient.invalidateQueries({ queryKey: schemaKeys.database(table.dbName) });
      if (lost.length > 0) void modal.warning({ title: 'Some formulas were not kept', content: `${lost.join(', ')} no longer work on the new query.` });
      else void message.success(`Table ${table.dbName}.${table.name} updated`);
      release();
      void navigate(schemaPathOf(table.dbName, table.name));
    },
    onError: error => void message.error(`Update table failed: ${toErrorMessage(error)}`)
  });

  const confirmUpdate = (table: TableSchema, sql: string) =>
    modal.confirm({
      title: 'Update Table From Query',
      content: `The ${table.tableType ?? 'view'} ${table.dbName}.${table.displayName || table.name} will read this query from now on.`,
      okText: 'Update',
      onOk: () => update.mutate({ table, sql })
    });

  return {
    creating: query === undefined ? undefined : { query, pending: create.isPending, error: create.error ? toErrorMessage(create.error) : undefined },
    onCreate: (sql, parameters) => {
      create.reset();
      setQuery(tableQueryOf(sql, parameters));
    },
    onCreateSubmit: form => create.mutate(form),
    onCreateCancel: () => setQuery(undefined),
    onUpdate: view && ((sql, parameters) => confirmUpdate(view, tableQueryOf(sql, parameters))),
    updating: update.isPending
  };
}
