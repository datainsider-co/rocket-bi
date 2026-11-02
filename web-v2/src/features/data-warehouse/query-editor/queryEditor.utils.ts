import type { JsonObject } from '@/core/json/json';
import { toQueryRequestJson, type Paging } from '@/core/query/QueryRequest';
import type { QueryParameter } from '@/core/query/queryParameters';
import { hasLimit, parameterValues, rawQuerySetting, runnableSql, syncParameters } from '@/core/query/rawQuery';
import type { TableHeader } from '@/core/query/VisualizationResponse';
import { escapeIdentifier } from '@/features/chart-builder/field-actions/formula.utils';
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

/** One Execute: the SQL and its parameters with the values they had then. */
export interface QueryRun {
  /** Tells two runs of the same SQL apart, so Execute always asks the server again. */
  readonly id: number;
  readonly sql: string;
  readonly parameters: readonly QueryParameter[];
}

/** The run of `sql`: the parameters it names, each with its value now (v1 kept them in `parameterValues`). */
export function toRun(id: number, sql: string, parameters: readonly QueryParameter[]): QueryRun {
  return { id, sql, parameters: syncParameters(sql, parameters) };
}

/** The first page of a result, as v1. */
export const RESULT_PAGE_SIZE = 20;
const ALL_ROWS: Paging = { from: -1, size: -1 };

/** Whether the result comes whole: the server doesn't page SQL with a `limit` (`hasLimit`). */
export function isWholeResult(run: QueryRun): boolean {
  return hasLimit(runnableSql(run.sql));
}

/** `chart/query` for a page of the run's result; every row when the server won't page it. */
export function rawQueryRequest(run: QueryRun, page: number, pageSize: number): JsonObject {
  const paging = isWholeResult(run) ? ALL_ROWS : { from: (page - 1) * pageSize, size: pageSize };
  return toQueryRequestJson({ setting: rawQuerySetting(runnableSql(run.sql), run.parameters), paging, parameters: parameterValues(run.parameters) });
}

/** `query/csv|xlsx` for the run's whole result. */
export function exportRequest(run: QueryRun): JsonObject {
  return toQueryRequestJson({ setting: rawQuerySetting(runnableSql(run.sql), run.parameters), paging: ALL_ROWS, parameters: parameterValues(run.parameters) });
}

export interface ResultColumn {
  readonly key: string;
  readonly title: string;
}

/** The result's columns: keyed `"0"`, `"1"`, ... by the server, titled with the names the SQL gave them. */
export function resultColumns(headers: readonly TableHeader[]): ResultColumn[] {
  return headers.map(header => ({ key: header.key, title: header.label }));
}

/** v1's name of a downloaded result has no table to take it from. */
export const EXPORT_FILE_NAME = 'query_result';
