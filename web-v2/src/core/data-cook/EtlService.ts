import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';
import {
  listingPageFromJson,
  listingRequestToJson,
  type ListingPage,
  type ListingRequest
} from '@/core/listing/Listing';
import { etlJobFromJson, etlJobToJson, newEtlJob, type EtlId, type EtlJob } from './EtlJob';

/** Columns of the backend's ETL table that the listings can sort by (checked in DC0; others are a 500). */
export const EtlSortField = {
  Id: 'id',
  Name: 'display_name',
  Owner: 'owner_id',
  CreatedTime: 'created_time',
  UpdatedTime: 'updated_time',
  NextExecuteTime: 'next_execute_time',
  LastExecuteTime: 'last_execute_time'
} as const;

export type EtlSortField = (typeof EtlSortField)[keyof typeof EtlSortField];

/** The three ETL listings: the user's own, shared with the user, and in the trash. */
export type EtlListing = 'mine' | 'shared' | 'trash';

const LISTING_PATHS: Readonly<Record<EtlListing, string>> = {
  mine: 'data_cook/my_etl',
  shared: 'data_cook/shared',
  trash: 'data_cook/trash'
};

/** ETLs and their runs (v1 `DataCookRepository`, minus preview, history and share). */
export interface EtlService {
  /** Listed ETLs come without their operators. */
  list(listing: EtlListing, request: ListingRequest<EtlSortField>, signal?: AbortSignal): Promise<ListingPage<EtlJob>>;
  /** Rejects with a 404 for an ETL that doesn't exist or is in the trash. */
  get(id: EtlId, signal?: AbortSignal): Promise<EtlJob>;
  /** An empty ETL without a schedule. */
  create(displayName: string): Promise<EtlJob>;
  update(etl: EtlJob): Promise<EtlJob>;
  moveToTrash(id: EtlId): Promise<void>;
  restore(id: EtlId): Promise<void>;
  /** Only for an ETL in the trash; 404 otherwise. */
  deleteForever(id: EtlId): Promise<void>;
  /** Runs the ETL at `atTime` (epoch millis) and keeps its schedule afterwards. */
  forceRun(id: EtlId, atTime: number): Promise<void>;
  cancel(id: EtlId): Promise<void>;
  /**
   * A warehouse table as a source's `table_schema`: the server's JSON, kept whole (v1 sent its `TableSchema` back as
   * it was read). Rejects when the table is gone.
   */
  getSourceTable(dbName: string, tblName: string, signal?: AbortSignal): Promise<JsonObject>;
}

export const EtlService = token<EtlService>('EtlService');

/** The only mode v1 sent for a forced run, as for ingestion jobs. */
const FORCE_MODE = 'Continuous';

/** Paths and bodies checked against the local stack (`DATA_COOK.md`, DC0). */
export class HttpEtlService implements EtlService {
  constructor(private readonly http: KyInstance) {}

  async list(listing: EtlListing, request: ListingRequest<EtlSortField>, signal?: AbortSignal): Promise<ListingPage<EtlJob>> {
    const json = await this.http.post(LISTING_PATHS[listing], { json: listingRequestToJson(request), signal }).json();
    return listingPageFromJson(json, etlJobFromJson);
  }

  async get(id: EtlId, signal?: AbortSignal): Promise<EtlJob> {
    return etlJobFromJson(await this.http.get(`data_cook/${id}`, { signal }).json());
  }

  async create(displayName: string): Promise<EtlJob> {
    return etlJobFromJson(await this.http.post('data_cook/create', { json: etlJobToJson(newEtlJob(displayName)) }).json());
  }

  async update(etl: EtlJob): Promise<EtlJob> {
    return etlJobFromJson(await this.http.put(`data_cook/${etl.id}`, { json: etlJobToJson(etl) }).json());
  }

  async moveToTrash(id: EtlId): Promise<void> {
    await this.http.delete(`data_cook/${id}`);
  }

  async restore(id: EtlId): Promise<void> {
    await this.http.post(`data_cook/trash/${id}/restore`);
  }

  async deleteForever(id: EtlId): Promise<void> {
    await this.http.delete(`data_cook/trash/${id}`);
  }

  async forceRun(id: EtlId, atTime: number): Promise<void> {
    await this.http.put(`data_cook/${id}/force_run`, { json: { at_time: atTime, mode: FORCE_MODE } });
  }

  /** The server answers `{ success: true }` even when nothing was running. */
  async cancel(id: EtlId): Promise<void> {
    await this.http.put(`data_cook/${id}/kill`, { json: {} });
  }

  async getSourceTable(dbName: string, tblName: string, signal?: AbortSignal): Promise<JsonObject> {
    const database = asRecord(await this.http.get(`databases/${encodeURIComponent(dbName)}`, { signal }).json());
    const table = asArray(database['tables']).map(asRecord).find(item => asString(item['name']) === tblName);
    if (!table) throw new Error(`Table ${dbName}.${tblName} no longer exists`);
    return { ...table, db_name: asString(table['db_name'], dbName) };
  }
}
