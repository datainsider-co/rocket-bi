import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';

/**
 * The CSV import of the server (`IngestionController`, `ingestion/csv/detect` → `ingestion/csv/schema` →
 * `POST ingestion/csv`), which v1 never used. Keys are the server's (snake_case), mapped field by field.
 */

/**
 * How the server splits the text. `add_batch_info` only exists in the old upload flow, so it is always `false`.
 * `ingestion/csv` ignores `include_header` (checked in DI0): the client drops the header row itself.
 */
export interface CsvSetting {
  readonly includeHeader: boolean;
  readonly delimiter: string;
}

export function csvSettingToJson(setting: CsvSetting): JsonObject {
  return { include_header: setting.includeHeader, delimiter: setting.delimiter, add_batch_info: false };
}

/**
 * A column of the table the file goes into. The server reads `name` and `display_name` the same way, so one name is
 * kept; `ingestion/csv/schema` turns it into a column name (`Mã số` → `Ma_so`) and keeps it as the display name.
 */
export interface CsvColumn {
  readonly name: string;
  /** `class_name`: `string`, `int64`, `datetime`, ... */
  readonly type: string;
  /** The column as the server sent it, so keys v2 doesn't edit (a date's `input_formats`) go back unchanged. */
  readonly json: JsonObject;
}

export function csvColumnFromJson(value: unknown): CsvColumn {
  const json = asRecord(value);
  const name = asString(json['display_name']) || asString(json['name']);
  return { name, type: asString(json['class_name']), json };
}

export function csvColumnToJson(column: CsvColumn): JsonObject {
  return { ...column.json, class_name: column.type, name: column.name, display_name: column.name };
}

/** What `detect` makes of a sample: the columns and the sample's rows as the server would insert them. */
export interface CsvPreview {
  readonly columns: readonly CsvColumn[];
  /** One array per row, converted to the column types: a value that doesn't convert is `null`. */
  readonly records: readonly (readonly unknown[])[];
}

export function csvPreviewFromJson(value: unknown): CsvPreview {
  const json = asRecord(value);
  return {
    columns: asArray(asRecord(json['schema'])['columns']).map(csvColumnFromJson),
    records: asArray(json['records']).map(asArray)
  };
}

export interface CsvTable {
  readonly dbName: string;
  readonly name: string;
  readonly displayName: string;
  readonly columns: readonly CsvColumn[];
}

/** A `TableSchema` with the keys the server sends back, so `detect` and `schema` take it as is. */
export function csvTableToJson(table: CsvTable): JsonObject {
  return {
    name: table.name,
    db_name: table.dbName,
    organization_id: 0,
    display_name: table.displayName,
    columns: table.columns.map(csvColumnToJson),
    primary_keys: [],
    partition_by: [],
    order_bys: [],
    table_type: 'default',
    expression_columns: [],
    calculated_columns: [],
    temporary: false
  };
}
