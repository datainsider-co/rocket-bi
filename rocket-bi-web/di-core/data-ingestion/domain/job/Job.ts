import { DataSourceType, FacebookAdsJob, GoogleAdsJob, GoogleAdsSourceInfo, PalexyJob, S3Job, TiktokAdsJob } from '@core/data-ingestion';
import { GoogleAnalyticJob } from '@core/data-ingestion/domain/job/google-analytic/GoogleAnalyticJob';

import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { JobId, SourceId } from '@core/common/domain';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { GoogleSheetJob } from '@core/data-ingestion/domain/job/GoogleSheetJob';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { FormMode } from '@core/data-ingestion/domain/job/FormMode';
import { UnsupportedJob } from '@core/data-ingestion/domain/job/UnsupportedJob';
import { BigQueryJob } from '@core/data-ingestion/domain/job/BigQueryJob';
import { JdbcJob } from '@core/data-ingestion/domain/job/JdbcJob';
import { JobType } from '@core/data-ingestion/domain/job/JobType';
import { JobStatus } from '@core/data-ingestion/domain/job/JobStatus';
import { RowData } from '@/shared/models';
import { GoogleSheetSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSheetSourceInfo';
import { UnsupportedSourceInfo } from '@core/data-ingestion/domain/data-source/UnsupportedSourceInfo';
import { GenericJdbcJob } from '@core/data-ingestion/domain/job/GenericJdbcJob';
import { MongoJob } from '@core/data-ingestion/domain/job/MongoJob';
import { ShopifyJob } from '@core/data-ingestion/domain/job/ShopifyJob';
import { GA4Job } from '@core/data-ingestion/domain/job/ga4/GA4Job';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';

export enum SyncMode {
  FullSync = 'FullSync',
  IncrementalSync = 'IncrementalSync'
}

export enum DataDestination {
  Hadoop = 'Hadoop',
  Clickhouse = 'Clickhouse'
}

export abstract class Job {
  static DEFAULT_ID = -1;
  abstract className: JobName;
  abstract jobId: JobId;
  abstract orgId: string;
  abstract displayName: string;
  abstract sourceId?: SourceId;
  abstract jobType: JobType;
  abstract syncIntervalInMn: number;
  abstract scheduleTime?: TimeScheduler;
  abstract destDatabaseName: string;
  abstract destTableName: string;
  abstract destinations: DataDestination[];
  abstract lastSuccessfulSync: number;
  abstract lastSyncStatus: JobStatus;
  abstract currentSyncStatus: JobStatus;
  abstract nextRunTime: number;

  // abstract displayCurrentStatus(): HTMLElement;

  //set orgId from DataSourceInfo into job orgId
  abstract setOrgId(dataSource: DataSourceInfo): Job;

  abstract get canCancel(): boolean;

  abstract get hasNextRunTime(): boolean;

  abstract get wasRun(): boolean;
  abstract copyWithDestDbName(dbName: string): Job;

  static fromObject(obj: any): Job {
    // Log.debug('Job::fromObject::obj::', obj.scheduleTime);

    switch (obj.className) {
      case JobName.Jdbc:
        return JdbcJob.fromObject(obj);
      case JobName.MongoJob:
        return MongoJob.fromObject(obj);
      case JobName.GenericJdbc:
        return GenericJdbcJob.fromObject(obj);
      case JobName.BigQueryJob:
        //todo: fix here
        return BigQueryJob.fromObject(obj);
      case JobName.GoogleAnalyticJob:
        return GoogleAnalyticJob.fromObject(obj);
      case JobName.GA4Job:
        return GA4Job.fromObject(obj);
      case JobName.GoogleSheetJob:
        return GoogleSheetJob.fromObject(obj);
      case JobName.ShopifyJob:
        return ShopifyJob.fromObject(obj);
      case JobName.S3Job:
        return S3Job.fromObject(obj);
      case JobName.GoogleAdsJob:
        return GoogleAdsJob.fromObject(obj);
      case JobName.FacebookAdsJob:
        return FacebookAdsJob.fromObject(obj);
      case JobName.TiktokAdsJob:
        return TiktokAdsJob.fromObject(obj);
      case JobName.PalexyJob:
        return PalexyJob.fromObject(obj);
      default:
        return UnsupportedJob.fromObject(obj);
    }
  }

  static default(dataSource: DataSourceInfo): Job {
    switch (dataSource.sourceType) {
      case DataSourceType.MSSql:
      case DataSourceType.MySql:
      case DataSourceType.Oracle:
      case DataSourceType.Redshift:
      case DataSourceType.BigQuery:
      case DataSourceType.PostgreSql:
      case DataSourceType.GenericJdbc:
        return JdbcJob.default(dataSource);
      case DataSourceType.GoogleSheet:
        return GoogleSheetJob.default(dataSource);

      case DataSourceType.GA:
        return GoogleAnalyticJob.default();
      case DataSourceType.BigQueryV2:
        return BigQueryJob.default(dataSource);
      case DataSourceType.MongoDB:
        return MongoJob.default(dataSource);
      case DataSourceType.Shopify:
        return ShopifyJob.default(dataSource);
      case DataSourceType.S3:
        return S3Job.default(dataSource);
      case DataSourceType.GA4:
        return GA4Job.default();
      case DataSourceType.GoogleAds:
        return GoogleAdsJob.default();
      case DataSourceType.Facebook:
        return FacebookAdsJob.default();
      case DataSourceType.Tiktok:
        return TiktokAdsJob.default();
      case DataSourceType.Palexy:
        return PalexyJob.default(dataSource);
      default:
        return UnsupportedJob.default(dataSource);
    }
  }

  static getJobFormConfigMode(job: Job) {
    switch (job.jobId) {
      case Job.DEFAULT_ID:
        return FormMode.Create;
      default:
        return FormMode.Edit;
    }
  }

  static getColorFromStatus(status: JobStatus): string {
    switch (status) {
      case JobStatus.Initialized:
        return '#ffc14e';
      case JobStatus.Synced:
        return '#07BC40';
      case JobStatus.Syncing:
        return '#4e8aff';
      case JobStatus.Error:
        return '#EA6B6B';
      default:
        return 'var(--secondary-text-color)';
    }
  }

  static jobIcon(rowData: RowData): string {
    switch (rowData.className) {
      case JobName.GoogleSheetJob:
        return 'ic_google_sheet_small.png';
      //todo: icon gg analytic
      case JobName.GA4Job:
        return 'ic_ga_4_small.svg';
      case JobName.GoogleAnalyticJob:
        return 'ic_ga_small.png';
      case JobName.Jdbc:
        return DataSourceInfo.dataSourceIcon(rowData.sourceType);
      case JobName.BigQueryJob:
        return 'ic_big_query_small.png';
      case JobName.MongoJob:
        return 'ic_mongo_small.png';
      case JobName.GenericJdbc:
        return 'ic_generic_jdbc_small.png';
      case JobName.ShopifyJob:
        return 'ic_shopify_small.png';
      case JobName.S3Job:
        return 'ic_s3_small.png';
      case JobName.GoogleAdsJob:
        return 'ic_gg_ads_small.png';
      case JobName.FacebookAdsJob:
        return 'ic_fb_ads_small.svg';
      case JobName.TiktokAdsJob:
        return 'ic_tiktok_ads_small.svg';
      case JobName.PalexyJob:
        return 'ic_palexy_small.svg';
      default:
        return 'ic_default.svg';
    }
  }

  abstract get lakeDirectory(): string;

  static havePreviewSchemaStep(job: Job) {
    switch (job.className) {
      case JobName.S3Job:
        return true;
      default:
        return false;
    }
  }

  abstract isShowLakeConfig: boolean;

  static isJdbcJob(job: Job): boolean {
    return job.className === JobName.Jdbc;
  }

  static isMongoJob(job: Job): boolean {
    return job.className === JobName.MongoJob;
  }

  static isGenericJdbcJob(job: Job): boolean {
    return job.className === JobName.GenericJdbc;
  }

  static isBigQueryJob(job: Job): boolean {
    return job.className === JobName.BigQueryJob;
  }

  static isGoogleAnalyticJob(job: Job): boolean {
    return job.className === JobName.GoogleAnalyticJob;
  }

  static isGoogleAnalytic4Job(job: Job): boolean {
    return job.className === JobName.GA4Job;
  }

  static isGoogleSheetJob(job: Job): boolean {
    return job.className === JobName.GoogleSheetJob;
  }

  static isShopifyJob(job: Job): boolean {
    return job.className === JobName.ShopifyJob;
  }

  static isTiktokAdsJob(job: Job): boolean {
    return job.className === JobName.TiktokAdsJob;
  }

  static isS3Job(job: Job): boolean {
    return job.className === JobName.S3Job;
  }

  static isPalexyJob(job: Job): boolean {
    return job.className === JobName.PalexyJob;
  }

  withDisplayName(displayName: string): Job {
    this.displayName = displayName;
    return this;
  }
}

export class JobInfo {
  job: Job;
  source: DataSourceInfo;

  constructor(job: Job, source: DataSourceInfo) {
    this.job = job;
    this.source = source;
  }

  static fromObject(obj: any & JobInfo): JobInfo {
    // Log.debug('JobInfo::FromObject::', obj);
    const scheduleTime = TimeScheduler.fromObject(obj.job.scheduleTime);
    const job: Job = Job.fromObject({ ...obj.job, scheduleTime: scheduleTime });
    const source = this.getSourceInfo(obj);
    return new JobInfo(job, source);
  }

  //handle case jobInfo with no source
  private static getSourceInfo(obj: any & JobInfo): DataSourceInfo {
    switch (obj.job.className) {
      case JobName.GoogleSheetJob:
        return GoogleSheetSourceInfo.default();
      case JobName.GoogleAnalyticJob:
        return GASourceInfo.default();
      case JobName.Jdbc:
      case JobName.MongoJob:
      case JobName.GenericJdbc:
      case JobName.BigQueryJob:
      case JobName.ShopifyJob:
      case JobName.S3Job:
      case JobName.GA4Job:
      case JobName.PalexyJob:
        return DataSourceInfo.fromDataSource(obj.source);
      case JobName.GoogleAdsJob:
        return GoogleAdsSourceInfo.default();
      default:
        return UnsupportedSourceInfo.fromObject(obj.source);
    }
  }
}
