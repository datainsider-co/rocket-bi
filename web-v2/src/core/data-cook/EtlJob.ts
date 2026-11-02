import { snakeCase } from 'lodash-es';
import { asArray, asNumber, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';
import { scheduleTimeFromJson, scheduleTimeToJson, type ScheduleTime } from '@/core/schedule/ScheduleTime';
import { UserProfile } from '@/core/user/UserProfile';
import { etlOperatorFromJson, etlOperatorToJson, type EtlOperator } from './EtlOperator';

/**
 * An ETL (backend `EtlJob`, `data_cook/*`): its operators, schedule, incremental settings and canvas layout. A plain
 * value with the JSON it was read from in `json`, like ingestion's `Job`.
 */

export type EtlId = number;

export const EtlStatus = {
  Initialized: 'Initialized',
  Queued: 'Queued',
  Running: 'Running',
  Done: 'Done',
  Error: 'Error',
  Terminated: 'Terminated',
  /** Older statuses v1 still knew. */
  Syncing: 'Syncing',
  Synced: 'Synced',
  Unknown: 'Unknown'
} as const;

export type EtlStatus = (typeof EtlStatus)[keyof typeof EtlStatus];

const ETL_STATUSES: readonly string[] = Object.values(EtlStatus);

/** Incremental run of a source table: rows whose `columnName` is past `value`. */
export interface IncrementalConfig {
  readonly columnName: string;
  readonly value: string;
}

export interface EtlJob {
  readonly id: EtlId;
  readonly displayName: string;
  /**
   * The leaves of the ETL, each nesting what it reads from. Empty in listings: `my_etl`, `shared` and `trash` leave
   * the operators out.
   */
  readonly operators: readonly EtlOperator[];
  readonly ownerId: string;
  readonly owner: UserProfile | undefined;
  readonly scheduleTime: ScheduleTime;
  readonly createdTime: number;
  readonly updatedTime: number;
  /** Epoch millis; see `hasNextExecution`. */
  readonly nextExecuteTime: number;
  /** Epoch millis; 0 before the first run. */
  readonly lastExecuteTime: number;
  readonly status: EtlStatus;
  /** Keyed as stored, see `incrementalKey`. */
  readonly incrementalConfigs: Readonly<Record<string, IncrementalConfig>>;
  /** Canvas layout, read and written with `etlExtraData`. */
  readonly extraData: JsonObject;
  readonly json: JsonObject;
}

/** A status v2 doesn't know reads as `Unknown`. */
export function etlStatusFromJson(value: unknown): EtlStatus {
  return ETL_STATUSES.includes(value as string) ? (value as EtlStatus) : EtlStatus.Unknown;
}

/**
 * The key of a source table in `map_incremental_config`. v1 kept the configs in a `Map` that its HTTP client
 * snake_cased on the way out (`sales1` → `sales_1`), and read them back with `snakeCase` too, so v2 does the same.
 */
export function incrementalKey(tblName: string): string {
  return snakeCase(tblName);
}

/**
 * The server answers without `class_name`, so any entry is incremental, except a `full` one, which v1 could write
 * but dropped on save.
 */
function incrementalConfigsFromJson(value: unknown): Record<string, IncrementalConfig> {
  const configs = asRecord(asRecord(value)['map_incremental_config']);
  return Object.fromEntries(
    Object.entries(configs)
      .filter(([, config]) => isRecord(config) && config['class_name'] !== 'full')
      .map(([key, config]) => {
        const json = asRecord(config);
        return [key, { columnName: asString(json['column_name']), value: asString(json['value']) }];
      })
  );
}

function incrementalConfigsToJson(configs: Readonly<Record<string, IncrementalConfig>>): JsonObject {
  return {
    map_incremental_config: Object.fromEntries(
      Object.entries(configs).map(([key, config]) => [
        key,
        { class_name: 'incremental', column_name: config.columnName, value: config.value }
      ])
    )
  };
}

export function etlJobFromJson(value: unknown): EtlJob {
  const json = asRecord(value);
  return {
    id: asNumber(json['id']),
    displayName: asString(json['display_name']),
    operators: asArray(json['operators']).map(etlOperatorFromJson),
    ownerId: asString(json['owner_id']),
    owner: isRecord(json['owner']) ? new UserProfile(json['owner']) : undefined,
    scheduleTime: scheduleTimeFromJson(json['schedule_time']),
    createdTime: asNumber(json['created_time']),
    updatedTime: asNumber(json['updated_time']),
    nextExecuteTime: asNumber(json['next_execute_time']),
    lastExecuteTime: asNumber(json['last_execute_time']),
    status: etlStatusFromJson(json['status']),
    incrementalConfigs: incrementalConfigsFromJson(json['config']),
    extraData: asRecord(json['extra_data']),
    json
  };
}

/** The body of `data_cook/create` and `PUT data_cook/{id}` (v1 `EtlJobRequest`). */
export function etlJobToJson(etl: EtlJob): JsonObject {
  return {
    display_name: etl.displayName,
    operators: etl.operators.map(etlOperatorToJson),
    schedule_time: scheduleTimeToJson(etl.scheduleTime),
    extra_data: etl.extraData,
    config: incrementalConfigsToJson(etl.incrementalConfigs)
  };
}

/** A new, empty ETL, as v1 created one on "New ETL". */
export function newEtlJob(displayName: string): EtlJob {
  return {
    id: 0,
    displayName,
    operators: [],
    ownerId: '',
    owner: undefined,
    scheduleTime: { kind: 'none' },
    createdTime: 0,
    updatedTime: 0,
    nextExecuteTime: 0,
    lastExecuteTime: 0,
    status: EtlStatus.Initialized,
    incrementalConfigs: {},
    extraData: {},
    json: {}
  };
}

/** v1 `canCancel`: queued or running. */
export function canCancelEtl(etl: EtlJob): boolean {
  return etl.status === EtlStatus.Queued || etl.status === EtlStatus.Running || etl.status === EtlStatus.Syncing;
}

/**
 * Whether `nextExecuteTime` is a run to come. The server sends `Long.MaxValue` when there is none, which JSON turns
 * into a number past `MAX_SAFE_INTEGER`. A run-once ETL only has one until it starts (v1 `hasNextRunTime`).
 */
export function hasNextExecution(etl: EtlJob): boolean {
  if (etl.scheduleTime.kind === 'none') return false;
  if (etl.nextExecuteTime <= 0 || etl.nextExecuteTime >= Number.MAX_SAFE_INTEGER) return false;
  if (etl.scheduleTime.kind === 'once') return etl.status === EtlStatus.Initialized || etl.status === EtlStatus.Queued;
  return true;
}
