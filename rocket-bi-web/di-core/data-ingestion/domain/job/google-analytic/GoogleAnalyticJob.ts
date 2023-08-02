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
import moment from 'moment';
import { DateTimeFormatter, DateUtils } from '@/utils';

export class GoogleAnalyticJob implements Job {
  className = JobName.GoogleAnalyticJob;
  displayName: string;
  tableName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  jobType = JobType.GoogleAnalytics;
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
  propertyId: string;
  dateRanges: GaDateRange[];
  metrics: MetricInfo[];
  dimensions: DimensionInfo[];
  sorts: string[];

  constructor(
    jobId: JobId,
    orgId: string,
    sourceId: SourceId,
    displayName: string,
    tableName: string,
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
    propertyId: string,
    dateRanges: GaDateRange[],
    metrics: MetricInfo[],
    dimensions: DimensionInfo[],
    sorts: string[],
    syncMode?: SyncMode
  ) {
    this.jobId = jobId;
    this.orgId = orgId;
    this.sourceId = sourceId;
    this.displayName = displayName;
    this.tableName = tableName;
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
    this.propertyId = propertyId;
    this.dateRanges = dateRanges;
    this.metrics = metrics;
    this.dimensions = dimensions;
    this.sorts = sorts;
    this.syncMode = syncMode || SyncMode.FullSync;
  }

  static fromObject(obj: any): GoogleAnalyticJob {
    return new GoogleAnalyticJob(
      obj.jobId,
      obj.orgId,
      obj.sourceId,
      obj.displayName,
      obj.tableName,
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
      obj.propertyId,
      obj.dateRanges,
      obj.metrics,
      obj.dimensions,
      obj.sorts,
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
      '',
      [DataDestination.Clickhouse],
      0,
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      '',
      '',
      [{ startDate: DateTimeFormatter.formatDateWithTime(GoogleAnalyticJob.defaultStartDate(), ''), endDate: GaDate.Today }],
      [],
      [],
      [],
      SyncMode.FullSync
    );
  }

  static defaultStartDate(): Date {
    return DateUtils.getLast30Days().start as Date;
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
