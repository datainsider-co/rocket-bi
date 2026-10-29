import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asNumber, asRecord, asString, type JsonObject } from '@/core/json/json';
import {
  csvPreviewFromJson,
  csvSettingToJson,
  csvTableToJson,
  type CsvColumn,
  type CsvPreview,
  type CsvSetting,
  type CsvTable
} from './CsvImport';

export interface CsvTableRef {
  readonly dbName: string;
  readonly name: string;
}

export interface CsvImportService {
  /**
   * Columns and converted rows of `sample` (the header row included when `setting.includeHeader`). Without `columns`
   * the server guesses the types; with them it converts the rows to those types.
   */
  detect(sample: string, setting: CsvSetting, columns?: readonly CsvColumn[], signal?: AbortSignal): Promise<CsvPreview>;
  /**
   * Creates the database if it is missing and the table, or adds the columns it lacks to an existing table. Returns
   * the table name the server made of `table.name` (`Đơn hàng` → `Don_hang`).
   */
  createTable(table: CsvTable): Promise<string>;
  /** Inserts rows, without a header, by column position. Returns the number of rows inserted. */
  ingest(table: CsvTableRef, delimiter: string, data: string, signal?: AbortSignal): Promise<number>;
}

export const CsvImportService = token<CsvImportService>('CsvImportService');

/** A chunk is inserted row by row on a slow warehouse; v1 waited 180 s. */
const INGEST_TIMEOUT_MS = 120_000;

/** On `ApiClient`: these routes check the session and, for `ingestion/csv`, the `database:edit:*` permission. */
export class HttpCsvImportService implements CsvImportService {
  constructor(private readonly http: KyInstance) {}

  async detect(sample: string, setting: CsvSetting, columns?: readonly CsvColumn[], signal?: AbortSignal): Promise<CsvPreview> {
    const json: JsonObject = { sample, csv_setting: csvSettingToJson(setting) };
    if (columns) json['schema'] = csvTableToJson({ dbName: '', name: '', displayName: '', columns });
    return csvPreviewFromJson(await this.http.post('ingestion/csv/detect', { json, signal }).json());
  }

  async createTable(table: CsvTable): Promise<string> {
    const json = await this.http.post('ingestion/csv/schema', { json: { schema: csvTableToJson(table) } }).json();
    return asString(asRecord(json)['name'], table.name);
  }

  async ingest(table: CsvTableRef, delimiter: string, data: string, signal?: AbortSignal): Promise<number> {
    const json = await this.http
      .post('ingestion/csv', {
        json: {
          db_name: table.dbName,
          tbl_name: table.name,
          csv_setting: csvSettingToJson({ includeHeader: false, delimiter }),
          data
        },
        signal,
        timeout: INGEST_TIMEOUT_MS
      })
      .json();
    return asNumber(asRecord(json)['row_inserted']);
  }
}
