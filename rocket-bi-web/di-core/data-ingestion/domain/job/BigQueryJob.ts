/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:35 PM
 */

import { DataDestination, DataSourceInfo, JobStatus, JobType, SyncMode } from '@core/data-ingestion';
import { JobId, SourceId } from '@core/common/domain';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { Job } from './Job';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { Log } from '@core/utils';
import moment from 'moment';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { SchedulerName } from '@/shared/enums/SchedulerName';

export class BigQueryJob implements Job {
  className = JobName.BigQueryJob;
  displayName: string;
  projectName: string;
  location: string;
  jobType = JobType.BigQuery;
  jobId: JobId;
  orgId: string;
  creatorId: string;
  sourceId: SourceId;
  syncMode: SyncMode;
  lastSuccessfulSync: number;
  syncIntervalInMn: number;
  scheduleTime: TimeScheduler;
  nextRunTime: number;
  lastSyncStatus: JobStatus;
  currentSyncStatus: JobStatus;
  datasetName: string;
  tableName: string;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  lastSyncedValue?: string;
  incrementalColumn?: string;
  selectedColumns: string[];
  rowRestrictions: string;

  constructor(
    jobId: JobId,
    orgId: string,
    displayName: string,
    projectName: string,
    location: string,
    sourceId: SourceId,
    creatorId: string,
    syncMode: SyncMode,
    lastSuccessfulSync: number,
    syncIntervalInMn: number,
    schedulerTime: TimeScheduler,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    databaseName: string,
    tableName: string,
    destDatabaseName: string,
    destTableName: string,
    destinations: DataDestination[],
    selectedColumns: string[],
    rowRestrictions: string,
    lastSyncedValue?: string,
    incrementalColumn?: string
  ) {
    this.jobId = jobId;
    this.orgId = orgId;
    this.displayName = displayName;
    this.projectName = projectName;
    this.location = location;
    this.sourceId = sourceId;
    this.creatorId = creatorId;
    this.syncMode = syncMode;
    this.lastSuccessfulSync = lastSuccessfulSync;
    this.syncIntervalInMn = syncIntervalInMn;
    this.scheduleTime = schedulerTime;
    this.nextRunTime = nextRunTime;
    this.lastSyncStatus = lastSyncStatus;
    this.currentSyncStatus = currentSyncStatus;
    this.datasetName = databaseName;
    this.tableName = tableName;
    this.destDatabaseName = destDatabaseName;
    this.destTableName = destTableName;
    this.destinations = destinations;
    this.lastSyncedValue = lastSyncedValue;
    this.selectedColumns = selectedColumns;
    this.rowRestrictions = rowRestrictions;
    this.incrementalColumn = incrementalColumn;
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

  static fromObject(obj: any): BigQueryJob {
    return new BigQueryJob(
      obj.jobId,
      obj.orgId ?? Job.DEFAULT_ID.toString(),
      obj.displayName,
      obj.projectName ?? '',
      obj.location ?? '',
      obj.sourceId,
      obj.creatorId,
      obj.syncMode,
      obj.lastSuccessfulSync,
      obj.syncIntervalInMn,
      obj.scheduleTime,
      obj.nextRunTime,
      obj.lastSyncStatus,
      obj.currentSyncStatus,
      obj.datasetName ?? '',
      obj.tableName,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations,
      obj.selectedColumns ?? [],
      obj.rowRestrictions ?? '',
      obj.lastSyncedValue ?? void 0,
      obj.incrementalColumn ?? void 0
    );
  }

  static default(dataSource: DataSourceInfo) {
    return new BigQueryJob(
      Job.DEFAULT_ID,
      Job.DEFAULT_ID.toString(),
      '',
      '',
      '',
      dataSource.id,
      '',
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
      [],
      '',
      '0'
    );
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
    if (this.datasetName && this.tableName) {
      return `/data/db/${this.datasetName}/${this.tableName}/`;
    } else {
      return `/data/db/`;
    }
  }

  get isShowLakeConfig(): boolean {
    return true;
  }

  copyWithDestDbName(dbName: string): Job {
    this.destDatabaseName = dbName;
    return this;
  }
}
