import {
  DataDestination,
  DataSourceInfo,
  GoogleSearchConsoleType,
  Job,
  JobStatus,
  JobType,
  PalexyDateRange,
  SearchAnalyticsConfig,
  SearchAnalyticsDataState,
  SearchAnalyticsType,
  SyncMode
} from '@core/data-ingestion';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { JobId, SourceId } from '@core/common/domain';
import { SchedulerOnce, TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time';
import { GaDateRange } from '@core/data-ingestion/domain/job/google-analytic/GaDateRange';
import { GaDate } from '@core/data-ingestion/domain/job/google-analytic/GaDate';
import { SchedulerName } from '@/shared';
import { GoogleSearchConsoleSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSearchConsoleSourceInfo';
import { cloneDeep } from 'lodash';

export class GoogleSearchConsoleJob implements Job {
  className = JobName.GoogleSearchConsoleJob;
  displayName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  jobType = JobType.GoogleSearchConsole;
  jobId: JobId;
  orgId: string;
  sourceId: SourceId;
  lastSuccessfulSync: number;
  syncIntervalInMn: number;
  scheduleTime: TimeScheduler;
  nextRunTime: number;
  lastSyncStatus: JobStatus;
  currentSyncStatus: JobStatus;
  syncMode: SyncMode;
  lastSyncedValue: string;

  propertyId: string;
  accountId: string;

  dateRange: PalexyDateRange;
  siteUrl: string;
  tableType: GoogleSearchConsoleType;
  searchAnalyticsConfig: SearchAnalyticsConfig;

  constructor(
    jobId: JobId,
    orgId: string,
    sourceId: SourceId,
    displayName: string,
    destDatabaseName: string,
    destTableName: string,
    destinations: DataDestination[],
    lastSuccessfulSync: number,
    lastSyncedValue: string,
    syncIntervalInMn: number,
    scheduleTime: TimeScheduler,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,

    propertyId: string,
    accountId: string,
    dateRange: PalexyDateRange,
    siteUrl: string,
    tableType: GoogleSearchConsoleType,
    searchAnalyticsConfig: SearchAnalyticsConfig,
    syncMode?: SyncMode
  ) {
    this.jobId = jobId;
    this.orgId = orgId;
    this.sourceId = sourceId;
    this.displayName = displayName;
    this.destDatabaseName = destDatabaseName;
    this.destTableName = destTableName;
    this.destinations = destinations;
    this.lastSuccessfulSync = lastSuccessfulSync;
    this.lastSyncedValue = lastSyncedValue;
    this.syncIntervalInMn = syncIntervalInMn;
    this.scheduleTime = scheduleTime;
    this.nextRunTime = nextRunTime;
    this.lastSyncStatus = lastSyncStatus;
    this.currentSyncStatus = currentSyncStatus;

    this.propertyId = propertyId;
    this.accountId = accountId;
    this.dateRange = dateRange;

    this.siteUrl = siteUrl;
    this.tableType = tableType;
    this.searchAnalyticsConfig = searchAnalyticsConfig;

    this.syncMode = syncMode || SyncMode.FullSync;
  }

  static fromObject(obj: any): GoogleSearchConsoleJob {
    return new GoogleSearchConsoleJob(
      obj.jobId,
      obj.orgId,
      obj.sourceId,
      obj.displayName,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations,
      obj.lastSuccessfulSync,
      obj.lastSyncedValue,
      obj.syncIntervalInMn,
      obj.scheduleTime,
      obj.nextRunTime,
      obj.lastSyncStatus,
      obj.currentSyncStatus,
      obj.propertyId,
      obj.accountId,
      PalexyDateRange.fromObject(obj.dateRange),
      obj.siteUrl,
      obj.tableType,
      obj.searchAnalyticsConfig,
      obj.syncMode
    );
  }
  //
  static default(source?: GoogleSearchConsoleSourceInfo): GoogleSearchConsoleJob {
    return new GoogleSearchConsoleJob(
      Job.DEFAULT_ID,
      '-1',
      source?.id ?? -1,
      '',
      '',
      '',
      [DataDestination.Clickhouse],
      0,
      '',
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      '',
      '',
      PalexyDateRange.default(),
      '',
      GoogleSearchConsoleType.SearchAnalytics,
      { type: SearchAnalyticsType.Web, dataState: SearchAnalyticsDataState.Final },
      SyncMode.FullSync
    );
  }

  setOrgId(dataSource: DataSourceInfo): Job {
    this.sourceId = dataSource.id;
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

  createSingleJob() {
    const clonedJob: GoogleSearchConsoleJob = cloneDeep(this);
    clonedJob.displayName = `${clonedJob.displayName} (table name: ${clonedJob.tableType})`;
    clonedJob.destTableName = clonedJob.tableType;
    return clonedJob;
  }
}
