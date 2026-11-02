import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asArray, asRecord, asString } from '@/core/json/json';
import { tableSchemaFromJson, type TableSchema } from '@/core/schema/SchemaService';
import type { EtlId } from './EtlJob';
import {
  etlOperatorToJson,
  expressionFieldToJson,
  fieldToJson,
  type EtlOperator,
  type ExpressionFieldConfiguration,
  type FieldConfiguration
} from './EtlOperator';

/** An operator whose table could not be built, and why (`errors` of `preview_sync`). */
export interface EtlPreviewError {
  readonly tblName: string;
  readonly message: string;
}

/**
 * What `preview_sync` built: a view per operator in the ETL's preview database, up to the first error. The status is
 * `Done` or `Error`; v1 read it as an ingestion `JobStatus`.
 */
export interface EtlPreview {
  readonly status: string;
  readonly tables: readonly TableSchema[];
  readonly errors: readonly EtlPreviewError[];
}

function etlPreviewFromJson(value: unknown): EtlPreview {
  const json = asRecord(value);
  return {
    status: asString(json['status']),
    tables: asArray(asRecord(json['data'])['all_table_schemas']).map(table => tableSchemaFromJson(table)),
    errors: asArray(json['errors']).map(error => {
      const item = asRecord(error);
      return { tblName: asString(item['error_tbl_name']), message: asString(item['message']) };
    })
  };
}

/** The editor's calls: build the ETL's tables as views to look at them, and show Manage Fields' SQL. */
export interface EtlPreviewService {
  /** `preview_etl_<id>`, the database the operators' tables are previewed in. */
  databaseName(id: EtlId, signal?: AbortSignal): Promise<string>;
  /**
   * Builds the tables of `operators` and of everything they read from. Without `force` the server reuses the views it
   * already built.
   */
  preview(id: EtlId, operators: readonly EtlOperator[], force: boolean, signal?: AbortSignal): Promise<EtlPreview>;
  /** The SQL Manage Fields runs, for showing it. */
  viewQuery(
    id: EtlId,
    fields: readonly FieldConfiguration[],
    extraFields: readonly ExpressionFieldConfiguration[],
    signal?: AbortSignal
  ): Promise<string>;
}

export const EtlPreviewService = token<EtlPreviewService>('EtlPreviewService');

export class HttpEtlPreviewService implements EtlPreviewService {
  constructor(private readonly http: KyInstance) {}

  async databaseName(id: EtlId, signal?: AbortSignal): Promise<string> {
    return asString(asRecord(await this.http.get(`data_cook/${id}/preview/database_name`, { signal }).json())['database_name']);
  }

  async preview(id: EtlId, operators: readonly EtlOperator[], force: boolean, signal?: AbortSignal): Promise<EtlPreview> {
    const json = { operators: operators.map(etlOperatorToJson), force };
    return etlPreviewFromJson(await this.http.post(`data_cook/${id}/preview_sync`, { json, signal }).json());
  }

  async viewQuery(
    id: EtlId,
    fields: readonly FieldConfiguration[],
    extraFields: readonly ExpressionFieldConfiguration[],
    signal?: AbortSignal
  ): Promise<string> {
    const json = { fields: fields.map(fieldToJson), extra_fields: extraFields.map(expressionFieldToJson) };
    return asString(asRecord(await this.http.post(`data_cook/${id}/view_query`, { json, signal }).json())['query']);
  }
}
