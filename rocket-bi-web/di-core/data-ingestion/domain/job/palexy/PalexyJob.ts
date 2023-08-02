import { DataDestination, DataSourceInfo, JobStatus, JobType, PalexyDateRange, SyncMode } from '@core/data-ingestion';
import { JobId, SourceId } from '@core/common/domain';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { Job } from '../Job';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { Log } from '@core/utils';
import moment from 'moment';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { SchedulerName } from '@/shared/enums/SchedulerName';

export class PalexyJob implements Job {
  className = JobName.PalexyJob;
  displayName: string;
  jobType = JobType.Palexy;
  jobId: JobId;
  orgId: string;
  creatorId: string;
  sourceId: SourceId;
  syncMode: SyncMode;
  lastSuccessfulSync: number;
  syncIntervalInMn: number;
  scheduleTime: TimeScheduler; //???
  nextRunTime: number; //???
  lastSyncStatus: JobStatus;
  currentSyncStatus: JobStatus;
  destDatabaseName: string;
  destTableName: string;
  destinations: DataDestination[];
  dimensions: string[];
  metrics: string[];
  dateRange: PalexyDateRange;

  constructor(
    jobId: JobId,
    orgId: string,
    displayName: string,
    sourceId: SourceId,
    creatorId: string,
    syncMode: SyncMode,
    lastSuccessfulSync: number,
    syncIntervalInMn: number,
    schedulerTime: TimeScheduler,
    nextRunTime: number,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: string,
    destTableName: string,
    destinations: DataDestination[],
    dimensions: string[],
    metrics: string[],
    dateRange: PalexyDateRange
  ) {
    this.jobId = jobId;
    this.orgId = orgId;
    this.displayName = displayName;
    this.sourceId = sourceId;
    this.creatorId = creatorId;
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
    this.dimensions = dimensions;
    this.metrics = metrics;
    this.dateRange = dateRange;
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

  static fromObject(obj: any): PalexyJob {
    return new PalexyJob(
      obj.jobId,
      obj.orgId ?? Job.DEFAULT_ID.toString(),
      obj.displayName,
      obj.sourceId,
      obj.creatorId,
      obj.syncMode,
      obj.lastSuccessfulSync,
      obj.syncIntervalInMn,
      obj.scheduleTime,
      obj.nextRunTime,
      obj.lastSyncStatus,
      obj.currentSyncStatus,
      obj.destDatabaseName,
      obj.destTableName,
      obj.destinations,
      obj.dimensions,
      obj.metrics,
      PalexyDateRange.fromObject(obj.dateRange)
    );
  }

  static default(dataSource: DataSourceInfo) {
    return new PalexyJob(
      Job.DEFAULT_ID,
      Job.DEFAULT_ID.toString(),
      'Palexy job',
      dataSource.id,
      '',
      SyncMode.FullSync,
      0,
      60,
      new SchedulerOnce(Date.now()),
      0,
      JobStatus.Initialized,
      JobStatus.Initialized,
      'palexy',
      'palexy_data',
      [DataDestination.Clickhouse],
      PalexyJob.defaultDimensions(),
      PalexyJob.defaultMetrics(),
      PalexyDateRange.default()
    );
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

  get isShowLakeConfig(): boolean {
    return true;
  }

  static getAllMetrics(): string[] {
    return [
      'visits',
      'walk_ins',
      'average_dwell_time',
      'interacted_customers',
      'interaction_rate',
      'average_interaction_time',
      'pass_by_traffic',
      'capture_rate',
      'net_sales_transactions',
      'conversion_rate',
      'sales_per_visitor',
      'net_sales_amount',
      'atv',
      'upt',
      'asp',
      'total_staff_hours',
      'average_visitors_per_staff_at_an_hour',
      'unique_staff_hours_with_visit',
      'maximum_visitors_per_staff_at_an_hour',
      'sales_per_staff_hour',
      'total_groups',
      'total_visitors_going_as_group',
      'onversion_by_opportunities',
      'group_rate',
      'average_group_size',
      'total_groups_with_kids',
      'total_known_groups',
      'groups_with_kids_rate',
      'greeting_rate',
      'avg_time_to_first_greeting',
      'on_time_greeting_rate'
    ];
  }

  static getAllDimensions(): string[] {
    return [
      'store_id',
      'store_code',
      'store_name',
      'day',
      'week',
      'month',
      'hour',
      'gender',
      'age_range',
      'store_metadata_1',
      'store_metadata_2',
      'store_metadata_3',
      'store_metadata_4',
      'store_metadata_5',
      'store_metadata_6',
      'store_metadata_7',
      'store_metadata_8',
      'store_metadata_9',
      'store_metadata_10'
    ];
  }

  static defaultMetrics() {
    return [
      'visits',
      'walk_ins',
      'average_dwell_time',
      'interacted_customers',
      'interaction_rate',
      'average_interaction_time',
      'pass_by_traffic',
      'capture_rate',
      'net_sales_transactions',
      'conversion_rate',
      'sales_per_visitor',
      'net_sales_amount',
      'atv',
      'upt',
      'asp',
      'total_staff_hours',
      'average_visitors_per_staff_at_an_hour',
      'unique_staff_hours_with_visit',
      'maximum_visitors_per_staff_at_an_hour',
      'sales_per_staff_hour',
      'total_groups',
      'total_visitors_going_as_group',
      'conversion_by_opportunities',
      'group_rate',
      'average_group_size',
      'total_groups_with_kids',
      'total_known_groups',
      'groups_with_kids_rate',
      'greeting_rate',
      'avg_time_to_first_greeting',
      'on_time_greeting_rate'
    ];
  }

  static defaultDimensions() {
    return ['store_id', 'store_code', 'store_name', 'day'];
  }

  getSuggestedMetrics() {
    if (this.dimensions.includes('hour')) {
      return PalexyJob.getAllMetrics().filter(item => !this.metrics.includes(item) && !item.includes('greeting') && !item.includes('time'));
    } else {
      return PalexyJob.getAllMetrics().filter(item => !this.metrics.includes(item));
    }
  }

  getSuggestedDimension() {
    if (this.metrics.some(item => item.includes('greeting') || item.includes('time'))) {
      return PalexyJob.getAllDimensions().filter(item => item !== 'hour' && !this.dimensions.includes(item));
    } else {
      return PalexyJob.getAllDimensions().filter(item => !this.dimensions.includes(item));
    }
  }

  copyWithDestDbName(dbName: string): Job {
    this.destDatabaseName = dbName;
    return this;
  }

  withDisplayName(displayName: string): Job {
    this.displayName = displayName;
    return this;
  }

  get lakeDirectory(): string {
    return '/';
  }
}
