import { DataDestination, DataSourceInfo, Job, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { DIException, JobId, SourceId } from '@core/common/domain';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import moment from 'moment';
import { Log } from '@core/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { SchedulerName } from '@/shared/enums/SchedulerName';

export class UnsupportedJob implements Job {
  className = JobName.UnsupportedJob;
  displayName: string;
  jobType = JobType.Unsupported;
  jobId: JobId;
  orgId: string;
  sourceId: SourceId;
  syncMode: SyncMode;
  lastSuccessfulSync: number;
  syncIntervalInMn: number;
  scheduleTime: TimeScheduler;
  nextRunTime: number;
  lastSyncStatus: JobStatus;
  currentSyncStatus: JobStatus;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];

  constructor(
    jobId: JobId,
    orgId: string,
    displayName: string,
    sourceId: SourceId,
    syncMode: SyncMode,
    lastSuccessfulSync: number,
    syncIntervalInMn: number,
    schedulerTime: TimeScheduler,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: string,
    destTableName: string,
    destinations: DataDestination[]
  ) {
    this.jobId = jobId;
    this.orgId = orgId;
    this.displayName = displayName;
    this.sourceId = sourceId;
    this.syncMode = syncMode;
    this.lastSuccessfulSync = lastSuccessfulSync;
    this.syncIntervalInMn = syncIntervalInMn;
    this.scheduleTime = schedulerTime;
    this.nextRunTime = nextRunTime;
    this.lastSyncStatus = lastSyncStatus;
    this.currentSyncStatus = currentSyncStatus;
    this.destDatabaseName = destDatabaseName;
    this.destTableName = destTableName;
    this.destinations = destinations;
  }

  setOrgId(dataSource: DataSourceInfo): Job {
    this.orgId = dataSource.orgId;
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

  get displaySyncMode(): string {
    switch (this.syncMode) {
      case SyncMode.FullSync:
        return 'Full sync';
      case SyncMode.IncrementalSync:
        return 'Incremental sync';
      default:
        return '--';
    }
  }

  static fromObject(obj: any): UnsupportedJob {
    return new UnsupportedJob(
      obj.jobId,
      obj.orgId ?? Job.DEFAULT_ID.toString(),
      obj.displayName,
      obj.sourceId,
      obj.syncMode,
      obj.lastSuccessfulSync,
      obj.syncIntervalInMn,
      obj.scheduleTime,
      obj.nextRunTime,
      obj.lastSyncStatus,
      obj.currentSyncStatus,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations
    );
  }

  static default(dataSource: DataSourceInfo) {
    return new UnsupportedJob(
      Job.DEFAULT_ID,
      Job.DEFAULT_ID.toString(),
      '',
      dataSource.id,
      SyncMode.FullSync,
      0,
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      '',
      '',
      [DataDestination.Clickhouse]
    );
  }

  // resetIncrementalColumn() {
  //   this.incrementalColumn = void 0;
  // }
  //
  // resetLastSyncedValue() {
  //   this.lastSyncedValue = '0';
  // }

  displayCurrentStatus(): HTMLElement {
    const color = Job.getColorFromStatus(this.currentSyncStatus);
    if (this.currentSyncStatus === JobStatus.Error || this.currentSyncStatus === JobStatus.Synced) {
      const syncTime = moment(this.nextRunTime);
      Log.debug('displayCurrentStatus::syncTime::', syncTime.toDate());
      const currentTime = moment(Date.now());
      const unitsOfTime = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
      let result = HtmlElementRenderUtils.buildTextColor('', 'var(--text-color)');
      for (let iterator = 0; iterator < unitsOfTime.length; iterator++) {
        const unitOfTime = unitsOfTime[iterator];
        // @ts-ignored
        const diff = syncTime.diff(currentTime, unitOfTime);
        if (diff !== 0) {
          result = HtmlElementRenderUtils.buildTextColor(`sync after ${diff} ${unitOfTime}`, 'var(--text-color)');
          break;
        }
      }
      return result;
    } else {
      return HtmlElementRenderUtils.buildTextColor(this.currentSyncStatus, color);
    }
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
    return false;
  }

  copyWithDestDbName(dbName: string): Job {
    throw new DIException('copyWithDestDbName is unsupported.');
  }

  withDisplayName(displayName: string): Job {
    this.displayName = displayName;
    return this;
  }
}
