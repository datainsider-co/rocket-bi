import { asNumber, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';
import { scheduleTimeFromJson, scheduleTimeToJson, type ScheduleTime } from '@/core/schedule/ScheduleTime';
import { UserProfile } from '@/core/user/UserProfile';
import { dataSourceFromJson, type DataSource, type SourceId } from './DataSource';

/**
 * A scheduled sync from a source into the warehouse (backend `Job`, `job/*`), discriminated by `class_name`. Plain
 * values with the JSON they were read from in `json`, like `DataSource`: edits are merged onto it, and jobs v2 can't
 * edit yet are `UnsupportedJob` (listed, synced, cancelled and deleted, never written back).
 */

export const JobClassName = {
  Jdbc: 'jdbc_job',
  GenericJdbc: 'generic_jdbc_job'
} as const;

export type JdbcJobClassName = (typeof JobClassName)[keyof typeof JobClassName];

/** `job_type` that goes with each `class_name`. */
const JOB_TYPE: Readonly<Record<JdbcJobClassName, string>> = {
  [JobClassName.Jdbc]: 'Jdbc',
  [JobClassName.GenericJdbc]: 'GenericJdbc'
};

export const JobStatus = {
  Synced: 'Synced',
  Error: 'Error',
  Queued: 'Queued',
  Syncing: 'Syncing',
  Compiling: 'Compiling',
  Initialized: 'Initialized',
  Killed: 'Killed',
  Terminated: 'Terminated',
  Unknown: 'Unknown'
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

const JOB_STATUSES: readonly string[] = Object.values(JobStatus);

/** What the Queued Jobs listing shows (`current_statuses` of `job/list`), as in v1. */
export const QUEUED_STATUSES: readonly JobStatus[] = [JobStatus.Queued, JobStatus.Initialized, JobStatus.Syncing];

export const SyncMode = {
  FullSync: 'FullSync',
  IncrementalSync: 'IncrementalSync'
} as const;

export type SyncMode = (typeof SyncMode)[keyof typeof SyncMode];

export type JobId = number;

export const NEW_JOB_ID: JobId = -1;

/** `next_run_time` of a job that will not run again, such as a `schedule_once` job that already ran. */
export const NEVER_RUNS = 99999999999999;

/** `last_synced_value` of a new job: incremental sync starts after it, and v1 sent `"0"` by default. */
export const DEFAULT_LAST_SYNCED_VALUE = '0';

interface JobBase {
  readonly id: JobId;
  readonly displayName: string;
  readonly className: string;
  readonly jobType: string;
  readonly sourceId: SourceId;
  readonly scheduleTime: ScheduleTime;
  readonly destDatabaseName: string;
  readonly destTableName: string;
  /** Epoch millis; 0 until the first successful sync. */
  readonly lastSuccessfulSync: number;
  readonly nextRunTime: number;
  readonly lastSyncStatus: JobStatus;
  readonly currentSyncStatus: JobStatus;
  readonly creatorId: string;
  readonly lastModified: number;
  readonly json: JsonObject;
}

/** `jdbc_job` and `generic_jdbc_job`. A generic job's `selected_columns` and `row_restrictions` stay in `json`. */
export interface JdbcJob extends JobBase {
  readonly kind: 'jdbc';
  readonly className: JdbcJobClassName;
  readonly syncMode: SyncMode;
  readonly databaseName: string;
  readonly tableName: string;
  readonly incrementalColumn: string | undefined;
  readonly lastSyncedValue: string;
}

export interface UnsupportedJob extends JobBase {
  readonly kind: 'unsupported';
}

export type Job = JdbcJob | UnsupportedJob;

/** A status v2 doesn't know reads as `Unknown`. */
export function jobStatusFromJson(value: unknown): JobStatus {
  return JOB_STATUSES.includes(value as string) ? (value as JobStatus) : JobStatus.Unknown;
}

function isJdbcClassName(value: string): value is JdbcJobClassName {
  return value === JobClassName.Jdbc || value === JobClassName.GenericJdbc;
}

export function jobFromJson(value: unknown): Job {
  const json = asRecord(value);
  const className = asString(json['class_name']);
  const base = {
    id: asNumber(json['job_id'], NEW_JOB_ID),
    displayName: asString(json['display_name']),
    jobType: asString(json['job_type']),
    sourceId: asNumber(json['source_id']),
    scheduleTime: scheduleTimeFromJson(json['schedule_time']),
    destDatabaseName: asString(json['dest_database_name']),
    destTableName: asString(json['dest_table_name']),
    lastSuccessfulSync: asNumber(json['last_successful_sync']),
    nextRunTime: asNumber(json['next_run_time']),
    lastSyncStatus: jobStatusFromJson(json['last_sync_status']),
    currentSyncStatus: jobStatusFromJson(json['current_sync_status']),
    creatorId: asString(json['creator_id']),
    lastModified: asNumber(json['last_modified']),
    json
  };
  if (!isJdbcClassName(className)) return { ...base, kind: 'unsupported', className };
  const incrementalColumn = json['incremental_column'];
  return {
    ...base,
    kind: 'jdbc',
    className,
    syncMode: json['sync_mode'] === SyncMode.IncrementalSync ? SyncMode.IncrementalSync : SyncMode.FullSync,
    databaseName: asString(json['database_name']),
    tableName: asString(json['table_name']),
    incrementalColumn: typeof incrementalColumn === 'string' && incrementalColumn ? incrementalColumn : undefined,
    lastSyncedValue: asString(json['last_synced_value'], DEFAULT_LAST_SYNCED_VALUE)
  };
}

export type JdbcJobValues = Pick<
  JdbcJob,
  | 'className'
  | 'displayName'
  | 'sourceId'
  | 'syncMode'
  | 'databaseName'
  | 'tableName'
  | 'destDatabaseName'
  | 'destTableName'
  | 'incrementalColumn'
  | 'lastSyncedValue'
  | 'scheduleTime'
>;

/** A job to create. Status fields start as the server expects for a new job, as in v1 (`JdbcJob.default`). */
export function newJdbcJob(values: JdbcJobValues): JdbcJob {
  return {
    ...values,
    kind: 'jdbc',
    id: NEW_JOB_ID,
    jobType: JOB_TYPE[values.className],
    lastSuccessfulSync: 0,
    nextRunTime: 0,
    lastSyncStatus: JobStatus.Initialized,
    currentSyncStatus: JobStatus.Initialized,
    creatorId: '',
    lastModified: 0,
    json: {}
  };
}

/** Defaults v1 sent for fields the form doesn't edit; a job read from the server keeps its own values. */
const NEW_JOB_JSON: JsonObject = {
  org_id: -1,
  sync_interval_in_mn: 60,
  destinations: ['Clickhouse'],
  max_fetch_size: 0
};

/** The body of `job/create` (`{ job }`), `PUT job/{id}` (`{ job }`) and `job/multi_create` (`base_job`). */
export function jdbcJobToJson(job: JdbcJob): JsonObject {
  return {
    ...NEW_JOB_JSON,
    ...job.json,
    class_name: job.className,
    job_id: job.id,
    job_type: JOB_TYPE[job.className],
    display_name: job.displayName,
    source_id: job.sourceId,
    sync_mode: job.syncMode,
    database_name: job.databaseName,
    table_name: job.tableName,
    dest_database_name: job.destDatabaseName,
    dest_table_name: job.destTableName,
    incremental_column: job.incrementalColumn ?? null,
    last_synced_value: job.lastSyncedValue,
    schedule_time: scheduleTimeToJson(job.scheduleTime),
    last_successful_sync: job.lastSuccessfulSync,
    next_run_time: job.nextRunTime,
    last_sync_status: job.lastSyncStatus,
    current_sync_status: job.currentSyncStatus
  };
}

/** v1 `canCancel`: the job is running or about to. */
export function canCancelJob(job: Job): boolean {
  return (
    job.currentSyncStatus === JobStatus.Syncing ||
    job.currentSyncStatus === JobStatus.Queued ||
    job.currentSyncStatus === JobStatus.Compiling
  );
}

/**
 * Whether `nextRunTime` is a real date. v1 decided from the schedule and status, and showed year 5138 for a
 * `schedule_once` job that had already run (it goes back to `Initialized` with `next_run_time` = `NEVER_RUNS`).
 */
export function hasNextRun(job: Job): boolean {
  return job.nextRunTime > 0 && job.nextRunTime < NEVER_RUNS;
}

/** A row of `job/list` and the response of `job/create`. */
export interface JobInfo {
  readonly job: Job;
  /** Missing when the source was deleted. */
  readonly source: DataSource | undefined;
  readonly creator: UserProfile | undefined;
}

export function jobInfoFromJson(value: unknown): JobInfo {
  const json = asRecord(value);
  return {
    job: jobFromJson(json['job']),
    source: isRecord(json['source']) ? dataSourceFromJson(json['source']) : undefined,
    creator: isRecord(json['creator']) ? new UserProfile(json['creator']) : undefined
  };
}
