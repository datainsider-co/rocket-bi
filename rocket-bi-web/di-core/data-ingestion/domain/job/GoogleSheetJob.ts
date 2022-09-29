import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { Column, JobId } from '@core/common/domain';
import { DataDestination, DataSourceInfo, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { Job } from './Job';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { SchedulerName } from '@/shared/enums/SchedulerName';

export interface DocumentSchema {
  name: string;
  dbName: string;
  organizationId: string;
  displayName: string;
  columns: Column[];
}

export interface DocumentTable {
  db_name: string;
  name: string;
  display_name: string;
  tables: Column[];
}

export class GoogleSheetJob implements Job {
  className = JobName.GoogleSheetJob;
  syncMode = SyncMode.FullSync;
  displayName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  jobType = JobType.GoogleSheet;
  jobId: JobId;
  orgId: string;
  // sourceId: SourceId;
  lastSuccessfulSync: number;
  syncIntervalInMn: number;
  scheduleTime: TimeScheduler;
  nextRunTime: number;
  lastSyncStatus: JobStatus;
  currentSyncStatus: JobStatus;

  spreadSheetId: string;
  sheetId: string;
  includeHeader: boolean;
  schema: DocumentSchema;

  accessToken: string;
  refreshToken: string;

  constructor(
    jobId: JobId,
    orgId: string,
    displayName: string,
    destDatabaseName: string,
    destTableName: string,
    destinations: DataDestination[],
    // sourceId: SourceId,
    lastSuccessfulSync: number,
    syncIntervalInMn: number,
    scheduleTime: TimeScheduler,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    spreadSheetId: string,
    sheetId: string,
    schema: DocumentSchema,
    includeHeader: boolean,
    accessToken: string,
    refreshToken: string
  ) {
    // super();
    this.jobId = jobId;
    this.orgId = orgId;
    this.displayName = displayName;
    this.destDatabaseName = destDatabaseName;
    this.destTableName = destTableName;
    this.destinations = destinations;
    // this.sourceId = sourceId;
    this.lastSuccessfulSync = lastSuccessfulSync;
    this.syncIntervalInMn = syncIntervalInMn;
    this.scheduleTime = scheduleTime;
    this.nextRunTime = nextRunTime;
    this.lastSyncStatus = lastSyncStatus;
    this.currentSyncStatus = currentSyncStatus;

    this.spreadSheetId = spreadSheetId;
    this.sheetId = sheetId;
    this.schema = schema;
    this.includeHeader = includeHeader;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  static fromObject(obj: any): GoogleSheetJob {
    return new GoogleSheetJob(
      obj.jobId,
      obj.orgId,
      obj.displayName,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations,
      // obj.sourceId,
      obj.lastSuccessfulSync,
      obj.syncIntervalInMn,
      obj.scheduleTime,
      obj.nextRunTime,
      obj.lastSyncStatus,
      obj.currentSyncStatus,

      obj.spreadSheetId,
      obj.sheetId,
      obj.schema,
      obj.includeHeader,
      obj.accessToken,
      obj.refreshToken
    );
  }

  //todo: check here no datasource with gg job
  static default(dataSource: DataSourceInfo): GoogleSheetJob {
    return new GoogleSheetJob(
      Job.DEFAULT_ID,
      '',
      '',
      '',
      '',
      [DataDestination.Clickhouse],
      // dataSource.id,
      0,
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,

      '',
      '',
      { columns: [], name: '', dbName: '', displayName: '', organizationId: '' },
      false,
      '',
      ''
    );
  }

  setOrgId(dataSource: DataSourceInfo): Job {
    // this.orgId = dataSource.orgId;
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
