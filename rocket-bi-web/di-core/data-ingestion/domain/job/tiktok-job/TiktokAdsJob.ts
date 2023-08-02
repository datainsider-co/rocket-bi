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
import { TikTokReport } from '@core/data-ingestion/domain/job/tiktok-job/TikTokReport';

export class TiktokAdsJob implements Job {
  static TIKTOK_REPORT_TYPE = 'report/integrated/get';

  className = JobName.TiktokAdsJob;
  orgId: string;
  jobId: JobId;
  displayName: string;
  jobType = JobType.Tiktok;
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
  advertiserId: string;
  tikTokEndPoint: string;
  tikTokReport: TikTokReport | null;

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
    advertiserId: string,
    tikTokEndPoint: string,
    tikTokReport: TikTokReport
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
    this.advertiserId = advertiserId;
    this.tikTokEndPoint = tikTokEndPoint;
    this.tikTokReport = tikTokReport;
  }

  static fromObject(obj: any): TiktokAdsJob {
    const report = obj.tikTokReport ? TikTokReport.fromObject(obj.tikTokReport) : TikTokReport.default();
    return new TiktokAdsJob(
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
      obj.advertiserId,
      obj.tikTokEndPoint,
      report
    );
  }

  //
  static default(): TiktokAdsJob {
    return new TiktokAdsJob(
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
      TikTokReport.default()
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

  get isTiktokReport(): boolean {
    return this.tikTokEndPoint === TiktokAdsJob.TIKTOK_REPORT_TYPE;
  }

  withTiktokReportType(type: string) {
    if (this.tikTokReport) {
      this.tikTokReport.reportType = type;
    } else {
      const report = TikTokReport.default();
      report.reportType = type;
      this.tikTokReport = report;
    }
    return this;
  }
}
