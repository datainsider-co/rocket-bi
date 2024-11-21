import { SchedulerOnce, TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time';
import { SchedulerName } from '@/shared';
import { JobId, SourceId } from '@core/common/domain';
import { DataDestination, DataSourceInfo, Job, JobStatus, JobType, PalexyDateRange, SyncMode } from '@core/data-ingestion';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { cloneDeep } from 'lodash';
import { MixpanelTableName } from './MixpanelTableName';

export class MixpanelJob implements Job {
  className = JobName.Mixpanel;
  displayName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  jobType = JobType.Mixpanel;
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

  dateRange: PalexyDateRange;
  tableName: MixpanelTableName;

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
    dateRange: PalexyDateRange,
    tableName: MixpanelTableName,
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
    this.syncMode = syncMode || SyncMode.FullSync;
    this.dateRange = dateRange;
    this.tableName = tableName;
  }

  static fromObject(obj: any): MixpanelJob {
    return new MixpanelJob(
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
      PalexyDateRange.fromObject(obj.dateRange),
      obj.tableName,
      obj.syncMode
    );
  }

  //
  static default(source?: DataSourceInfo): MixpanelJob {
    return new MixpanelJob(
      Job.DEFAULT_ID,
      '-1',
      source?.id ?? -1,
      'Mixpanel job',
      'mixpanel',
      MixpanelTableName.Export,
      [DataDestination.Clickhouse],
      0,
      '',
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      PalexyDateRange.default(),
      MixpanelTableName.Export
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

  getMultiJob(): Job[] {
    return Object.values(MixpanelTableName).map(tableName => {
      const job = cloneDeep(this);
      job.displayName = `${job.displayName} (table name: ${tableName})`;
      job.tableName = tableName;
      job.destTableName = tableName;
      return job;
    });
  }
}
