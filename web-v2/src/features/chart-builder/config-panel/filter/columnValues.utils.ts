import { asString, type JsonObject } from '@/core/json/json';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { SqlView } from '@/core/relationship/QueryView';

/** v1 `FilterConstants.DEFAULT_LOAD_ITEM_SIZE`. */
export const VALUES_PAGE_SIZE = 80;

/** The ad hoc view a view field reads, for the query's `sql_views`; none for other fields or unknown views. */
export function sqlViewsOf(field: JsonObject, sqlQueryOf?: (viewName: string) => string | undefined): JsonObject[] {
  if (field['class_name'] !== 'view_field') return [];
  const name = asString(field['view_name']);
  const query = sqlQueryOf?.(name);
  return query === undefined ? [] : [new SqlView({ alias_name: name, query: { query } }).toJson()];
}

/**
 * The column's distinct values in order (v1 `QueryProfileBuilder.buildQueryForStringData`): a table of one
 * `select_distinct` column sorted ascending, reading the first element of a nested column.
 */
export function columnValuesSetting(field: JsonObject, isNested: boolean, sqlViews: readonly JsonObject[]): JsonObject {
  const func = { class_name: 'select_distinct', field, ...(isNested && { scalar_function: { class_name: 'get_array_element', index: 1 } }) };
  return {
    class_name: 'table_chart_setting',
    columns: [
      {
        name: asString(field['field_name']),
        function: func,
        is_horizontal_view: false,
        is_collapse: false,
        is_calc_group_total: true,
        is_calc_min_max: false,
        is_dynamic_function: false
      }
    ],
    sorts: [{ class_name: 'order_by', function: func, order: 'ASC' }],
    filters: [],
    formatters: [],
    sql_views: sqlViews,
    options: {}
  };
}

export interface ValuesPage {
  /** Values to pick from: empty and null ones are left out, a list condition can't filter by them. */
  readonly values: readonly string[];
  /** Rows the page held, empty ones too, to page on. */
  readonly rows: number;
  readonly total: number;
}

const valueOf = (cell: unknown) => (cell === null || cell === undefined ? '' : String(cell));

export function valuesPageOf(response: VisualizationResponse): ValuesPage {
  let cells: unknown[] = [];
  let total = 0;
  if (response.kind === 'json_table') {
    const key = response.headers[0]?.key ?? '';
    cells = response.records.map(record => record[key]);
    total = response.total;
  } else if (response.kind === 'table') {
    cells = response.records.map(record => record[0]);
    total = response.total;
  }
  return { values: cells.map(valueOf).filter(value => value !== ''), rows: cells.length, total };
}

/** Where the next page starts, or none once every row is loaded or a page comes back empty. */
export function nextValuesFrom(pages: readonly ValuesPage[]): number | undefined {
  const loaded = pages.reduce((sum, page) => sum + page.rows, 0);
  const last = pages.at(-1);
  return last && last.rows > 0 && loaded < last.total ? loaded : undefined;
}

/** The values to show: the picked ones the pages don't hold yet first, then the loaded ones. */
export function shownValues(loaded: readonly string[], picked: readonly string[]): string[] {
  const known = new Set(loaded);
  return [...new Set([...picked.filter(value => !known.has(value)), ...loaded])];
}
