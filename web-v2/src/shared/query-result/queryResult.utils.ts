import type { JsonObject } from '@/core/json/json';
import { toQueryRequestJson, type Paging } from '@/core/query/QueryRequest';
import type { QueryParameter } from '@/core/query/queryParameters';
import { hasLimit, parameterValues, rawQuerySetting, runnableSql, syncParameters } from '@/core/query/rawQuery';
import type { TableHeader } from '@/core/query/VisualizationResponse';

/** Running SQL and paging its result (v1 `QueryComponent`): the Query Editor and Data Cook's SQL Query. */

export const queryResultKeys = {
  all: ['raw-query'] as const,
  run: (runId: number | undefined, request: JsonObject | undefined) => ['raw-query', runId, request] as const
};

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

export interface ResultColumn {
  readonly key: string;
  readonly title: string;
}

/** The result's columns: keyed `"0"`, `"1"`, ... by the server, titled with the names the SQL gave them. */
export function resultColumns(headers: readonly TableHeader[]): ResultColumn[] {
  return headers.map(header => ({ key: header.key, title: header.label }));
}
