/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:35 PM
 */

import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { JobId, SourceId } from '@core/common/domain';
import { DataDestination, DataSourceInfo, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { MetricInfo } from '@core/data-ingestion/domain/job/MetricInfo';
import { DimensionInfo } from '@core/data-ingestion/domain/job/DimensionInfo';
import { Job } from '../Job';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { SchedulerName } from '@/shared/enums/SchedulerName';
import { GaDate } from '@core/data-ingestion/domain/job/google-analytic/GaDate';
import { GaDateRange } from '@core/data-ingestion/domain/job/google-analytic/GaDateRange';

export class GoogleAnalyticJob implements Job {
  className = JobName.GoogleAnalyticJob;
  displayName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  jobType = JobType.GoogleCredential;
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

  viewId: string | undefined;
  dateRanges: GaDateRange[];
  metrics: MetricInfo[];
  dimensions: DimensionInfo[];
  sorts: string[];

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
    syncIntervalInMn: number,
    scheduleTime: TimeScheduler,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,

    viewId: string,
    dateRanges: GaDateRange[],
    metrics: MetricInfo[],
    dimensions: DimensionInfo[],
    sorts: string[],
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
    this.syncIntervalInMn = syncIntervalInMn;
    this.scheduleTime = scheduleTime;
    this.nextRunTime = nextRunTime;
    this.lastSyncStatus = lastSyncStatus;
    this.currentSyncStatus = currentSyncStatus;

    this.viewId = viewId;
    this.dateRanges = dateRanges;
    this.metrics = metrics;
    this.dimensions = dimensions;
    this.sorts = sorts;

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.authorizationCode = authorizationCode;
    this.syncMode = syncMode || SyncMode.FullSync;
  }

  static fromObject(obj: any): GoogleAnalyticJob {
    return new GoogleAnalyticJob(
      obj.jobId,
      obj.orgId,
      obj.sourceId,
      obj.displayName,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations,
      obj.lastSuccessfulSync,
      obj.syncIntervalInMn,
      obj.scheduleTime,
      obj.nextRunTime,
      obj.lastSyncStatus,
      obj.currentSyncStatus,
      obj.viewId,
      obj.dateRanges,
      obj.metrics,
      obj.dimensions,
      obj.sorts,
      obj.accessToken,
      obj.refreshToken,
      '',
      obj.syncMode
    );
  }
  //
  static default(): GoogleAnalyticJob {
    return new GoogleAnalyticJob(
      Job.DEFAULT_ID,
      '-1',
      -1,
      '',
      '',
      '',
      [DataDestination.Clickhouse],
      0,
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      '',
      [{ startDate: new Date(), endDate: GaDate.Today }],
      [],
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
}
