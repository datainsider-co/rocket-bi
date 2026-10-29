import type { JsonObject } from '@/core/json/json';
import { formatParamValue, ParamValueType, type QueryParameter } from './queryParameters';

/**
 * Raw SQL as the query editor runs it (backend `RawQuerySetting`). The server wraps the SQL in
 * `select * from (<sql>) as v limit <size> offset <from>`, so only one `select` runs, and puts parameter values in
 * with a regex built from the name (`QueryParser.applyParameters`), so names are word characters only.
 */

const PARAMETER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

/** Names of the `{{ name }}` placeholders, in order of first appearance. */
export function parameterNames(sql: string): string[] {
  return [...new Set(Array.from(sql.matchAll(PARAMETER_PATTERN), match => match[1] ?? ''))];
}

/**
 * The parameters the SQL uses, in its order: known ones kept as they are, new ones added as empty text (v1). Parameters
 * the SQL no longer names are dropped.
 */
export function syncParameters(sql: string, parameters: readonly QueryParameter[]): QueryParameter[] {
  const byName = new Map(parameters.map(parameter => [parameter.displayName, parameter]));
  return parameterNames(sql).map(name => byName.get(name) ?? { displayName: name, valueType: ParamValueType.Text, value: '' });
}

/** What the request's `parameters` holds: each value formatted for the SQL, by name. */
export function parameterValues(parameters: readonly QueryParameter[]): Record<string, string> {
  return Object.fromEntries(parameters.map(parameter => [parameter.displayName, formatParamValue(parameter.valueType, parameter.value)]));
}

/**
 * Whether the server will skip paging: it looks for ` limit ` in the lowercased SQL (`SqlRegex.LimitRegex`), anywhere,
 * strings and subqueries included. Its `total` then still counts the rows without the limit.
 */
export function hasLimit(sql: string): boolean {
  return /\slimit\s/.test(sql.toLowerCase());
}

/** The setting to query raw SQL with; `toQueryRequestJson` adds paging and the request's own `parameters`. */
export function rawQuerySetting(sql: string, parameters: readonly QueryParameter[]): JsonObject {
  return {
    class_name: 'raw_query_setting',
    sql,
    sql_views: [],
    filters: [],
    sorts: [],
    parameters: parameterValues(parameters),
    options: {}
  };
}
