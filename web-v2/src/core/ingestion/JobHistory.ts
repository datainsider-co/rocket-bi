import { asNumber, asRecord, asString } from '@/core/json/json';
import { jobStatusFromJson, type JobId, type JobStatus } from './Job';

/** One run of a job (backend `JobHistory`, `history/list`). */
export interface JobHistory {
  readonly syncId: number;
  readonly jobId: JobId;
  readonly jobName: string;
  /** Epoch millis the run ended. */
  readonly lastSyncTime: number;
  /** Duration in millis. */
  readonly totalSyncedTime: number;
  readonly syncStatus: JobStatus;
  readonly totalRowsInserted: number;
  /** The error of a failed run; empty otherwise. */
  readonly message: string;
}

export function jobHistoryFromJson(value: unknown): JobHistory {
  const json = asRecord(value);
  return {
    syncId: asNumber(json['sync_id']),
    jobId: asNumber(json['job_id']),
    jobName: asString(json['job_name']),
    lastSyncTime: asNumber(json['last_sync_time']),
    totalSyncedTime: asNumber(json['total_synced_time']),
    syncStatus: jobStatusFromJson(json['sync_status']),
    totalRowsInserted: asNumber(json['total_rows_inserted']),
    message: asString(json['message'])
  };
}
