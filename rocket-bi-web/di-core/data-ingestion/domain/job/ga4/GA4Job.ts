import { DataDestination, DataSourceInfo, Job, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { JobId, SourceId } from '@core/common/domain';
import { SchedulerOnce, TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time';
import { GaDateRange } from '@core/data-ingestion/domain/job/google-analytic/GaDateRange';
import { GA4Metric } from '@core/data-ingestion/domain/job/ga4/GA4Mertric';
import { Ga4Dimension } from '@core/data-ingestion/domain/job/ga4/Ga4Dimension';
import { GaDate } from '@core/data-ingestion/domain/job/google-analytic/GaDate';
import { SchedulerName } from '@/shared';

export class GA4Job implements Job {
  className = JobName.GA4Job;
  displayName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  jobType = JobType.GA4;
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
  dateRanges: GaDateRange[];
  metrics: GA4Metric[];
  dimensions: Ga4Dimension[];

  accessToken: string;
  refreshToken: string;
  authorizationCode: string;

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
    dateRanges: GaDateRange[],
    metrics: GA4Metric[],
    dimensions: Ga4Dimension[],
    accessToken: string,
    refreshToken: string,
    authorizationCode: string,
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
    this.dateRanges = dateRanges;
    this.metrics = metrics;
    this.dimensions = dimensions;

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.authorizationCode = authorizationCode;
    this.syncMode = syncMode || SyncMode.FullSync;
  }

  static fromObject(obj: any): GA4Job {
    return new GA4Job(
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
      obj.dateRanges,
      obj.metrics,
      obj.dimensions,
      obj.accessToken,
      obj.refreshToken,
      '',
      obj.syncMode
    );
  }
  //
  static default(): GA4Job {
    return new GA4Job(
      Job.DEFAULT_ID,
      '-1',
      -1,
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
      [{ startDate: new Date(), endDate: GaDate.Today }],
      [],
      [],
      '',
      '',
      '',
      SyncMode.FullSync
    );
  }

  setToken(accessToken: string, refreshToken: string) {
    this.refreshToken = refreshToken;
    this.accessToken = accessToken;
    return this;
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    return this;
  }

  setAuthorizationCode(authCode: string) {
    this.authorizationCode = authCode;
    return this;
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
}
