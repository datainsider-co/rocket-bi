/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:35 PM
 */

import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { JobId, SourceId } from '@core/common/domain';
import { DataDestination, DataSourceInfo, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { Job } from '../Job';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { SchedulerName } from '@/shared/enums/SchedulerName';

export class GoogleAdsJob implements Job {
  className = JobName.GoogleAdsJob;
  orgId: string;
  jobId: JobId;
  displayName: string;
  jobType = JobType.GoogleAds;
  lastModified: number;
  syncMode: SyncMode;
  sourceId: SourceId;
  lastSuccessfulSync: number;
  syncIntervalInMn: number;
  nextRunTime: number;
  lastSyncStatus: JobStatus;
  currentSyncStatus: JobStatus;
  scheduleTime: TimeScheduler;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  customerId: string;
  resourceName: string;
  lastSyncedValue: string;
  incrementalColumn?: string;
  extraSegments?: string[];
  startDate?: string;
  constructor(
    orgId: string,
    jobId: JobId,
    displayName: string,
    lastModified: number,
    syncMode: SyncMode,
    sourceId: SourceId,
    lastSuccessfulSync: number,
    syncIntervalInMn: number,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: TimeScheduler,
    destDatabaseName: string,
    destTableName: string,
    destinations: DataDestination[],
    customerId: string,
    resourceName: string,
    lastSyncedValue: string,
    incrementalColumn?: string,
    extraSegments?: string[],
    startDate?: string
  ) {
    this.orgId = orgId;
    this.jobId = jobId;
    this.displayName = displayName;
    this.lastModified = lastModified;
    this.syncMode = syncMode;
    this.sourceId = sourceId;
    this.lastSuccessfulSync = lastSuccessfulSync;
    this.syncIntervalInMn = syncIntervalInMn;
    this.nextRunTime = nextRunTime;
    this.lastSyncStatus = lastSyncStatus;
    this.currentSyncStatus = currentSyncStatus;
    this.scheduleTime = scheduleTime;
    this.destDatabaseName = destDatabaseName;
    this.destTableName = destTableName;
    this.destinations = destinations;
    this.customerId = customerId;
    this.resourceName = resourceName;
    this.lastSyncedValue = lastSyncedValue;
    this.incrementalColumn = incrementalColumn;
    this.extraSegments = extraSegments;
    this.startDate = startDate;
  }

  static fromObject(obj: any): GoogleAdsJob {
    return new GoogleAdsJob(
      obj.orgId,
      obj.jobId,
      obj.displayName,
      obj.lastModified,
      obj.syncMode,
      obj.sourceId,
      obj.lastSuccessfulSync,
      obj.syncIntervalInMn,
      obj.nextRunTime,
      obj.lastSyncStatus,
      obj.currentSyncStatus,
      obj.scheduleTime,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations,
      obj.customerId,
      obj.resourceName,
      obj.lastSyncedValue,
      obj.incrementalColumn,
      obj.extraSegments,
      obj.startDate
    );
  }
  //
  static default(): GoogleAdsJob {
    return new GoogleAdsJob(
      '0',
      Job.DEFAULT_ID,
      '',
      0,
      SyncMode.FullSync,
      -1,
      0,
      0,
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      new SchedulerOnce(Date.now()),
      '',
      '',
      [DataDestination.Clickhouse],
      '',
      '',
      '',
      void 0,
      [],
      void 0
    );
  }

  setOrgId(dataSource: DataSourceInfo): Job {
    return this;
  }

  get canCancel(): boolean {
    return this.isSyncing || this.isQueued || this.isCompiling;
  }

  get isSyncing(): boolean {
    return this.currentSyncStatus === JobStatus.Syncing;
  }

  get isQueued() {
    return this.currentSyncStatus === JobStatus.Queued;
  }

  get isCompiling(): boolean {
    return this.currentSyncStatus === JobStatus.Compiling;
  }

  get hasNextRunTime() {
    if (this.scheduleTime!.className === SchedulerName.Once) {
      switch (this.currentSyncStatus) {
        case JobStatus.Initialized:
        case JobStatus.Queued:
          return true;
        default:
          return false;
      }
    } else {
      return true;
    }
  }

  get wasRun() {
    return this.lastSuccessfulSync > 0;
  }

  get lakeDirectory(): string {
    return `/data/db/`;
  }

  get isShowLakeConfig(): boolean {
    return true;
  }

  copyWithDestDbName(dbName: string): Job {
    this.destDatabaseName = dbName;
    return this;
  }
  withDisplayName(displayName: string): Job {
    this.displayName = displayName;
    return this;
  }
  withIncrementalColumn(columnName: string): GoogleAdsJob {
    this.incrementalColumn = columnName;
    return this;
  }
}
