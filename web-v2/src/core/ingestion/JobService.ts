import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asRecord } from '@/core/json/json';
import {
  listingPageFromJson,
  listingRequestToJson,
  type ListingPage,
  type ListingRequest
} from '@/core/listing/Listing';
import { jdbcJobToJson, jobInfoFromJson, type JdbcJob, type JobId, type JobInfo, type JobStatus } from './Job';

/** Columns of the backend `job` table that `job/list` can sort by. v1's `source_name` is not one (500). */
export const JobSortField = {
  Id: 'id',
  Name: 'name',
  Type: 'job_type',
  Creator: 'creator_id',
  LastModified: 'last_modified',
  SyncMode: 'sync_mode',
  Source: 'source_id',
  LastSuccessfulSync: 'last_successful_sync',
  NextRunTime: 'next_run_time',
  LastSyncStatus: 'last_sync_status',
  CurrentSyncStatus: 'current_sync_status'
} as const;

export type JobSortField = (typeof JobSortField)[keyof typeof JobSortField];

/** Jobs and their runs (v1 `JobRepository`). Every call needs the `SchedulerClient`. */
export interface JobService {
  /** `statuses` filters on the current status, as the Queued Jobs listing does. */
  list(
    request: ListingRequest<JobSortField>,
    statuses?: readonly JobStatus[],
    signal?: AbortSignal
  ): Promise<ListingPage<JobInfo>>;
  create(job: JdbcJob): Promise<JobInfo>;
  /**
   * One job per table, from `baseJob` (`job/multi_create`). The server names each `"<name> (database: d, table: t)"`
   * and writes to a table named like the source table in `baseJob.destDatabaseName`.
   */
  createForTables(baseJob: JdbcJob, tableNames: readonly string[]): Promise<void>;
  update(job: JdbcJob): Promise<void>;
  delete(id: JobId): Promise<void>;
  deleteMany(ids: readonly JobId[]): Promise<void>;
  /** Runs the job at `atTime` (epoch millis) and keeps its schedule afterwards. */
  syncNow(id: JobId, atTime: number): Promise<void>;
  /** Whether each job was scheduled. */
  syncManyNow(ids: readonly JobId[], atTime: number): Promise<Record<JobId, boolean>>;
  /** `false` when the job was not running. */
  cancel(id: JobId): Promise<boolean>;
}

export const JobService = token<JobService>('JobService');

/** The only mode the server takes for a forced run (`OnceTime` is a 400); v1 always sent it. */
const FORCE_MODE = 'Continuous';

/** Paths and bodies are the backend's; checked against the local stack (`DATA_INGESTION.md`, DI0). */
export class HttpJobService implements JobService {
  constructor(private readonly http: KyInstance) {}

  async list(
    request: ListingRequest<JobSortField>,
    statuses?: readonly JobStatus[],
    signal?: AbortSignal
  ): Promise<ListingPage<JobInfo>> {
    const body = { ...listingRequestToJson(request), ...(statuses ? { current_statuses: statuses } : {}) };
    return listingPageFromJson(await this.http.post('job/list', { json: body, signal }).json(), jobInfoFromJson);
  }

  async create(job: JdbcJob): Promise<JobInfo> {
    return jobInfoFromJson(await this.http.post('job/create', { json: { job: jdbcJobToJson(job) } }).json());
  }

  async createForTables(baseJob: JdbcJob, tableNames: readonly string[]): Promise<void> {
    await this.http.post('job/multi_create', { json: { base_job: jdbcJobToJson(baseJob), table_names: tableNames } });
  }

  async update(job: JdbcJob): Promise<void> {
    await this.http.put(`job/${job.id}`, { json: { job: jdbcJobToJson(job) } });
  }

  async delete(id: JobId): Promise<void> {
    await this.http.delete(`job/${id}`);
  }

  async deleteMany(ids: readonly JobId[]): Promise<void> {
    await this.http.delete('job/multi_delete', { json: { ids } });
  }

  async syncNow(id: JobId, atTime: number): Promise<void> {
    await this.http.put(`schedule/job/${id}/now`, { json: { at_time: atTime, mode: FORCE_MODE } });
  }

  async syncManyNow(ids: readonly JobId[], atTime: number): Promise<Record<JobId, boolean>> {
    const json = asRecord(
      await this.http.put('schedule/job/multi_sync/now', { json: { at_time: atTime, mode: FORCE_MODE, ids } }).json()
    );
    return Object.fromEntries(ids.map(id => [id, json[String(id)] === true]));
  }

  async cancel(id: JobId): Promise<boolean> {
    return asRecord(await this.http.put(`schedule/job/${id}/kill`, { json: {} }).json())['success'] === true;
  }
}
