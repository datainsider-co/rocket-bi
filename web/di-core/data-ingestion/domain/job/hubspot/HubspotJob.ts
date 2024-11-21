import { SchedulerOnce, TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time';
import { SchedulerName } from '@/shared';
import { JobId, SourceId } from '@core/common/domain';
import { DataDestination, DataSourceInfo, HubspotObjectType, Job, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { cloneDeep } from 'lodash';

export class HubspotJob implements Job {
  className = JobName.Hubspot;
  displayName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  jobType = JobType.Hubspot;
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

  subType: HubspotObjectType;

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
    subType: HubspotObjectType,
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
    this.subType = subType;
    this.syncMode = syncMode || SyncMode.FullSync;
  }

  static fromObject(obj: any): HubspotJob {
    return new HubspotJob(
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
      obj.subType,
      obj.syncMode
    );
  }

  //
  static default(source?: DataSourceInfo): HubspotJob {
    return new HubspotJob(
      Job.DEFAULT_ID,
      '-1',
      source?.id ?? -1,
      'Hubspot job',
      'hubspot',
      'contact',
      [DataDestination.Clickhouse],
      0,
      '',
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      HubspotObjectType.Contact,
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

  getMultiJob(): Job[] {
    return Object.values(HubspotObjectType).map(tableType => {
      const job = cloneDeep(this);
      job.displayName = `${job.displayName} (table name: ${tableType})`;
      job.subType = tableType;
      job.destTableName = tableType;
      return job;
    });
  }
}
