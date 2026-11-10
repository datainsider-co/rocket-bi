import type { JsonObject } from '@/core/json/json';
import { toQueryRequestJson, type Paging } from '@/core/query/QueryRequest';
import { parameterValues, rawQuerySetting, runnableSql } from '@/core/query/rawQuery';
import { escapeIdentifier } from '@/features/chart-builder/field-actions/formula.utils';
import type { QueryRun } from '@/shared/query-result/queryResult.utils';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

/** What the URL opens (v1 `QueryEditorMode`): a new query, a view's query to update, a saved analysis. */
export const EditorMode = {
  Query: 'query',
  UpdateTable: 'update',
  Analysis: 'analysis'
} as const;
export type EditorMode = (typeof EditorMode)[keyof typeof EditorMode];

export interface EditorSource {
  readonly mode: EditorMode;
  readonly dbName?: string | undefined;
  readonly tableName?: string | undefined;
  readonly analysisId?: number | undefined;
}

/** v1 `QueryEditor.mode`: `?mode=update`, else `?adhoc=<dashboard id>`, else a new query; `?database&table` with each. */
export function editorSourceOf(params: URLSearchParams): EditorSource {
  const dbName = params.get('database') || undefined;
  const tableName = (dbName && params.get('table')) || undefined;
  if (params.get('mode') === 'update') return { mode: EditorMode.UpdateTable, dbName, tableName };
  const analysisId = Number(params.get('adhoc'));
  if (Number.isInteger(analysisId) && analysisId > 0) return { mode: EditorMode.Analysis, dbName, tableName, analysisId };
  return { mode: EditorMode.Query, dbName, tableName };
}

/** The Query Editor on a saved analysis (v1 `?adhoc=`). */
export function analysisPath(id: number): string {
  return `${getWarehouseSection(WarehouseSection.QueryEditor).path}?adhoc=${id}`;
}

/** A table as SQL names it (v1 `FormulaUtils.toQuery`): `db.table`, with backticks where needed. */
export function tableReference(dbName: string, tableName: string): string {
  return `${escapeIdentifier(dbName)}.${escapeIdentifier(tableName)}`;
}

/** A column clicked in the tree, as v1 put it in: `table.column`. */
export function columnReference(tableName: string, columnName: string): string {
  return `${escapeIdentifier(tableName)}.${escapeIdentifier(columnName)}`;
}

/** The query a new editor on `?database&table` starts with (v1 `selectTable`); it doesn't run by itself. */
export function selectAllQuery(dbName: string, tableName: string): string {
  return `select * from ${tableReference(dbName, tableName)}`;
}

/** What Execute runs (v1 `getProcessedQuery`): the selected text, or everything when nothing is selected. */
export function sqlToRun(text: string, selected: string): string {
  return selected.trim() === '' ? text : selected;
}

const ALL_ROWS: Paging = { from: -1, size: -1 };

/** `query/csv|xlsx` for the run's whole result. */
export function exportRequest(run: QueryRun): JsonObject {
  return toQueryRequestJson({ setting: rawQuerySetting(runnableSql(run.sql), run.parameters), paging: ALL_ROWS, parameters: parameterValues(run.parameters) });
}

/** v1's name of a downloaded result has no table to take it from. */
export const EXPORT_FILE_NAME = 'query_result';
