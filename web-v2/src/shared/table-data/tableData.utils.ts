import type { JsonObject } from '@/core/json/json';
import { toQueryRequestJson } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { JsonTableResponse } from '@/core/query/VisualizationResponse';
import type { ColumnDefinition } from '@/core/schema/TableDefinition';

/** What a table's rows are read with: a warehouse table (`TableDefinition`) or a schema (`TableSchema`) both fit. */
export interface PreviewTable {
  readonly dbName: string;
  readonly name: string;
  readonly columns: readonly Pick<ColumnDefinition, 'name' | 'displayName' | 'type'>[];
}

/** A page of a table's rows; the request is the key, and `version` a table rebuilt under the same name. */
export const tableDataKeys = {
  all: ['table-data'] as const,
  page: (request: JsonObject, version: string) => ['table-data', version, request] as const
};

/** The page of the preview v1 asked for first. */
export const PREVIEW_PAGE_SIZE = 20;

/**
 * The Table Data tab's query (v1 `SchemaUtils.buildQuery`): a grouped table with one `select` per column, sorted by
 * one of them when the user asked. Only the table's own columns: measures and calculated columns have no row values to
 * show. Nothing of a dashboard goes with it (v1 sent the last opened dashboard's filters).
 */
export function tablePreviewRequest(table: PreviewTable, page: number, pageSize: number, sort: TableSort | undefined): JsonObject {
  type Column = PreviewTable['columns'][number];
  const field = (column: Column) => ({
    class_name: 'table_field',
    db_name: table.dbName,
    tbl_name: table.name,
    field_name: column.name,
    field_type: column.type
  });
  const select = (column: Column) => ({ class_name: 'select', field: field(column) });
  const sorted = sort && table.columns.find(column => column.name === sort.column);
  const setting = {
    class_name: 'group_table_chart_setting',
    columns: table.columns.map(column => ({
      name: column.name,
      function: select(column),
      is_horizontal_view: false,
      is_collapse: false,
      is_calc_group_total: true,
      is_calc_min_max: false,
      is_dynamic_function: false
    })),
    filters: [],
    sorts: sorted ? [{ class_name: 'order_by', function: select(sorted), order: sort.direction }] : [],
    sql_views: [],
    parameters: {},
    options: {}
  };
  return toQueryRequestJson({ setting, paging: { from: (page - 1) * pageSize, size: pageSize } });
}

export interface PreviewColumn {
  readonly key: string;
  /** The column's name, which a sort refers to. */
  readonly name: string;
  readonly title: string;
}

/** The preview's columns: the response names them, the table gives their display names. */
export function previewColumns(response: Pick<JsonTableResponse, 'headers'>, table: PreviewTable): PreviewColumn[] {
  return response.headers.map(header => ({
    key: header.key,
    name: header.label,
    title: table.columns.find(column => column.name === header.label)?.displayName ?? header.label
  }));
}

/** Key of each preview row; header keys are the server's hashes, so it can't clash with one. */
export const PREVIEW_ROW_KEY = '__row';

/** The page's rows, each keyed by its place in the whole result (rows have no id of their own). */
export function previewRows(records: readonly JsonObject[], offset: number): JsonObject[] {
  return records.map((record, index) => ({ ...record, [PREVIEW_ROW_KEY]: String(offset + index) }));
}
