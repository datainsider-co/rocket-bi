import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { DataRange, JobId, SourceId } from '@core/common/domain';
import {
  DataDestination,
  DataSourceInfo,
  FacebookDatePresetMode,
  FacebookDateRange,
  formatToFacebookDateTime,
  JobStatus,
  JobType,
  SyncMode
} from '@core/data-ingestion';
import { Job } from '../Job';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { SchedulerName } from '@/shared/enums/SchedulerName';
import { DateRange } from '@/shared';

export class FacebookAdsJob implements Job {
  className = JobName.FacebookAdsJob;
  orgId: string;
  jobId: JobId;
  displayName: string;
  jobType = JobType.Facebook;
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
  accountId: string;
  tableName: string;
  lastSyncedValue: string;

  datePreset?: FacebookDatePresetMode;

  timeRange?: FacebookDateRange;

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
    accountId: string,
    tableName: string,
    lastSyncedValue: string,
    datePreset?: FacebookDatePresetMode,
    timeRange?: FacebookDateRange
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
    this.accountId = accountId;
    this.tableName = tableName;
    this.lastSyncedValue = lastSyncedValue;
    this.datePreset = datePreset;
    this.timeRange = timeRange;
  }

  static fromObject(obj: any): FacebookAdsJob {
    return new FacebookAdsJob(
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
      obj.accountId,
      obj.tableName,
      obj.lastSyncedValue,
      obj.datePreset,
      obj.timeRange
    );
  }
  //
  static default(): FacebookAdsJob {
    return new FacebookAdsJob(
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
      FacebookDatePresetMode.last7days
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

  withDatePreset(mode: FacebookDatePresetMode): FacebookAdsJob {
    this.datePreset = mode;
    this.timeRange = void 0;
    return this;
  }
  withDateRange(dateRange: DateRange): FacebookAdsJob {
    const { start, end } = dateRange;
    this.datePreset = void 0;
    this.timeRange = { since: formatToFacebookDateTime(start), until: formatToFacebookDateTime(end) };
    return this;
  }
}
