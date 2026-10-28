import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asArray, asRecord, isRecord } from '@/core/json/json';
import {
  listingPageFromJson,
  listingRequestToJson,
  type ListingPage,
  type ListingRequest
} from '@/core/listing/Listing';
import { UserProfile } from '@/core/user/UserProfile';
import { dataSourceFromJson, jdbcSourceToJson, type DataSource, type JdbcSource, type SourceId } from './DataSource';

/** Columns of the backend `source` table that `source/list` can sort by. */
export const SourceSortField = {
  Id: 'id',
  Name: 'name',
  Creator: 'creator_id',
  LastModified: 'last_modified',
  Type: 'data_source_type'
} as const;

export type SourceSortField = (typeof SourceSortField)[keyof typeof SourceSortField];

/** A row of `source/list`. */
export interface SourceInfo {
  readonly source: DataSource;
  readonly creator: UserProfile | undefined;
}

/** Sources and what they hold (v1 `DataSourceRepository`). Every call needs the `SchedulerClient`. */
export interface DataSourceService {
  list(request: ListingRequest<SourceSortField>, signal?: AbortSignal): Promise<ListingPage<SourceInfo>>;
  get(id: SourceId): Promise<DataSource>;
  /** Resolves when the server can connect; fails with a 400 carrying the driver's message otherwise. */
  test(source: JdbcSource): Promise<void>;
  create(source: JdbcSource): Promise<DataSource>;
  update(source: JdbcSource): Promise<void>;
  delete(id: SourceId): Promise<void>;
  deleteMany(ids: readonly SourceId[]): Promise<void>;
  listDatabases(id: SourceId, signal?: AbortSignal): Promise<string[]>;
  listTables(id: SourceId, databaseName: string, signal?: AbortSignal): Promise<string[]>;
  /** Columns of a table, to pick the incremental column from. */
  listColumns(id: SourceId, databaseName: string, tableName: string, signal?: AbortSignal): Promise<string[]>;
}

export const DataSourceService = token<DataSourceService>('DataSourceService');

/**
 * `extra_data` is a JSON string that only BigQuery reads (`projectName`, `location`, camelCase inside the string as v1
 * sent it); JDBC sources take an empty object.
 */
const NO_EXTRA_DATA = '{}';

function toNames(value: unknown): string[] {
  return asArray(value).filter((name): name is string => typeof name === 'string');
}

function sourceInfoFromJson(value: unknown): SourceInfo {
  const json = asRecord(value);
  return {
    source: dataSourceFromJson(json['data_source']),
    creator: isRecord(json['creator']) ? new UserProfile(json['creator']) : undefined
  };
}

/** Paths and bodies are the backend's; checked against the local stack (`DATA_INGESTION.md`, DI0). */
export class HttpDataSourceService implements DataSourceService {
  constructor(private readonly http: KyInstance) {}

  async list(request: ListingRequest<SourceSortField>, signal?: AbortSignal): Promise<ListingPage<SourceInfo>> {
    const json = await this.http.post('source/list', { json: listingRequestToJson(request), signal }).json();
    return listingPageFromJson(json, sourceInfoFromJson);
  }

  async get(id: SourceId): Promise<DataSource> {
    return dataSourceFromJson(await this.http.get(`source/${id}`).json());
  }

  async test(source: JdbcSource): Promise<void> {
    await this.http.post('source/test', { json: jdbcSourceToJson(source) });
  }

  async create(source: JdbcSource): Promise<DataSource> {
    const json = await this.http.post('source/create', { json: { data_source: jdbcSourceToJson(source) } }).json();
    return dataSourceFromJson(json);
  }

  async update(source: JdbcSource): Promise<void> {
    await this.http.put(`source/${source.id}`, { json: { data_source: jdbcSourceToJson(source) } });
  }

  async delete(id: SourceId): Promise<void> {
    await this.http.delete(`source/${id}`);
  }

  async deleteMany(ids: readonly SourceId[]): Promise<void> {
    await this.http.delete('source/multi_delete', { json: { ids } });
  }

  async listDatabases(id: SourceId, signal?: AbortSignal): Promise<string[]> {
    return toNames(await this.http.post(`source/${id}/database`, { json: { extra_data: NO_EXTRA_DATA }, signal }).json());
  }

  async listTables(id: SourceId, databaseName: string, signal?: AbortSignal): Promise<string[]> {
    const json = { source_id: id, database_name: databaseName, extra_data: NO_EXTRA_DATA };
    return toNames(await this.http.post('source/table', { json, signal }).json());
  }

  async listColumns(id: SourceId, databaseName: string, tableName: string, signal?: AbortSignal): Promise<string[]> {
    const json = { source_id: id, database_name: databaseName, table_name: tableName, extra_data: NO_EXTRA_DATA };
    return toNames(await this.http.post('source/column', { json, signal }).json());
  }
}
