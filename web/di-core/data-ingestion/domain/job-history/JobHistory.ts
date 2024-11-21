/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:54 PM
 */

import { JobStatus } from '@core/data-ingestion';
import { JobId, SyncId } from '@core/common/domain';

export class JobHistory {
  syncId: SyncId;
  jobId: JobId;
  jobName: string;
  lastSyncTime: number;
  totalSyncedTime: number;
  syncStatus: JobStatus;
  message: string;
  totalRowsInserted: number;

  constructor(
    syncId: SyncId,
    jobId: JobId,
    jobName: string,
    lastSyncTime: number,
    totalSyncedTime: number,
    syncStatus: JobStatus,
    message: string,
    totalRowsInserted: number
  ) {
    this.syncId = syncId;
    this.jobId = jobId;
    this.jobName = jobName;
    this.lastSyncTime = lastSyncTime;
    this.totalSyncedTime = totalSyncedTime;
    this.syncStatus = syncStatus;
    this.message = message;
    this.totalRowsInserted = totalRowsInserted;
  }

  static fromObject(obj: JobHistory & any): JobHistory {
    return new JobHistory(obj.syncId, obj.jobId, obj.jobName, obj.lastSyncTime, obj.totalSyncedTime, obj.syncStatus, obj.message, obj.totalRowsInserted);
  }
}
