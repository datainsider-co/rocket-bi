import { CSVFileConfig, DataDestination, DataSourceInfo, Job, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { FileConfig } from '@core/data-ingestion/domain/job/FileConfig';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { JobId, SourceId, TableSchema } from '@core/common/domain';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { Log } from '@core/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import moment from 'moment';
import { SchedulerName } from '@/shared/enums/SchedulerName';

export enum FileArchiveFormat {
  gz = 'gz',
  z = '7z',
  zip = 'zip',
  xz = 'xz',
  none = 'none'
}

export class S3Job implements Job {
  className = JobName.S3Job;
  displayName: string;
  jobType = JobType.S3;
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
  databaseName: string;
  tableName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  maxFetchSize: number;
  incrementalColumn?: string;
  lastSyncedValue?: string;
  bucketName: string;
  fileArchiveFormat: FileArchiveFormat;
  fileConfig: FileConfig;
  folderPath: string;
  incrementalTime: number;
  tableSchema?: TableSchema;

  constructor(
    jobId: JobId,
    orgId: string,
    displayName: string,
    sourceId: SourceId,
    syncMode: SyncMode,
    lastSuccessfulSync: number,
    syncIntervalInMn: number,
    scheduleTime: TimeScheduler,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    databaseName: string,
    tableName: string,
    destDatabaseName: string,
    destTableName: string,
    destinations: DataDestination[],
    maxFetchSize: number,
    bucketName: string,
    fileArchiveFormat: FileArchiveFormat,
    fileConfig: FileConfig,
    folderPath: string,
    incrementalTime: number,
    tableSchema?: TableSchema,
    incrementalColumn?: string,
    lastSyncedValue?: string
  ) {
    this.jobId = jobId;
    this.orgId = orgId;
    this.displayName = displayName;
    this.sourceId = sourceId;
    this.syncMode = syncMode;
    this.lastSuccessfulSync = lastSuccessfulSync;
    this.syncIntervalInMn = syncIntervalInMn;
    this.scheduleTime = scheduleTime;
    this.nextRunTime = nextRunTime;
    this.lastSyncStatus = lastSyncStatus;
    this.currentSyncStatus = currentSyncStatus;
    this.databaseName = databaseName;
    this.tableName = tableName;
    this.destDatabaseName = destDatabaseName;
    this.destTableName = destTableName;
    this.destinations = destinations;
    this.incrementalColumn = incrementalColumn;
    this.lastSyncedValue = lastSyncedValue;
    this.maxFetchSize = maxFetchSize;
    this.bucketName = bucketName;
    this.fileArchiveFormat = fileArchiveFormat;
    this.fileConfig = fileConfig;
    this.folderPath = folderPath;
    this.incrementalTime = incrementalTime;
    this.tableSchema = tableSchema;
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

  static fromObject(obj: any): S3Job {
    const fileConfig = FileConfig.fromObject(obj.fileConfig);
    const tableSchema = obj.tableSchema ? TableSchema.fromObject(obj.tableSchema) : void 0;
    return new S3Job(
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
      obj.databaseName ?? '',
      obj.tableName,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations,
      obj.maxFetchSize ?? 0,
      obj.bucketName,
      obj.fileArchiveFormat,
      fileConfig,
      obj.folderPath,
      obj.incrementalTime,
      tableSchema,
      obj.incrementalColumn ?? void 0,
      obj.lastSyncedValue ?? void 0
    );
  }

  static default(dataSource: DataSourceInfo) {
    const fileConfig = CSVFileConfig.default();
    return new S3Job(
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
      '',
      '',
      [DataDestination.Clickhouse],
      0,
      '',
      FileArchiveFormat.none,
      fileConfig,
      '',
      1641000000000, //1/1/2022
      void 0,
      void 0,
      '0'
    );
  }

  resetIncrementalColumn() {
    this.incrementalColumn = void 0;
  }

  resetLastSyncedValue() {
    this.lastSyncedValue = '0';
  }

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
    if (this.databaseName && this.tableName) {
      return `/data/db/${this.databaseName}/${this.tableName}/`;
    } else {
      return `/data/db/`;
    }
  }

  updateScheduler(): Job {
    this.scheduleTime = TimeScheduler.toSchedulerV2(this.scheduleTime!);
    return this;
  }

  setTableSchema(tableSchema: TableSchema) {
    this.tableSchema = tableSchema;
  }

  removeTableSchema() {
    this.tableSchema = void 0;
  }

  get incrementalTimeAsDate(): Date {
    return new Date(this.incrementalTime);
  }

  set incrementalTimeAsDate(date: Date) {
    this.incrementalTime = date.getTime();
  }

  copyWith(payload: { displayName?: string }): S3Job {
    this.displayName = payload.displayName || this.displayName;
    return this;
  }

  get isShowLakeConfig(): boolean {
    return true;
  }

  copyWithDestDbName(dbName: string): Job {
    this.destDatabaseName = dbName;
    return this;
  }
}
