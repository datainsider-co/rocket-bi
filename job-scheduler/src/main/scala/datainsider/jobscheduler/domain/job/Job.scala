package datainsider.jobscheduler.domain.job

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import datainsider.jobscheduler.domain.JobProgress
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.job.JobType.JobType
import datainsider.jobscheduler.domain.job.SyncMode.SyncMode

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JdbcJob], name = "jdbc_job"),
    new Type(value = classOf[GaJob], name = "ga_job"),
    new Type(value = classOf[HubspotJob], name = "hubspot_job"),
    new Type(value = classOf[FacebookAdsJob], name = "facebook_ads_job"),
    new Type(value = classOf[GoogleSheetJob], name = "google_sheets_job"),
    new Type(value = classOf[GoogleSheetJobV2], name = "google_sheets_job_v2"),
    new Type(value = classOf[MongoJob], name = "mongo_db_job"),
    new Type(value = classOf[BigQueryStorageJob], name = "bigquery_storage_job"),
    new Type(value = classOf[GenericJdbcJob], name = "generic_jdbc_job"),
    new Type(value = classOf[SolanaJob], name = "solana_job"),
    new Type(value = classOf[CoinMarketCapJob], name = "coin_market_cap_job"),
    new Type(value = classOf[ShopifyJob], name = "shopify_job"),
    new Type(value = classOf[AmazonS3Job], name = "amazon_s3_job"),
    new Type(value = classOf[GoogleAdsJob], name = "google_ads_job"),
    new Type(value = classOf[Ga4Job], name = "ga4_job"),
    new Type(value = classOf[FacebookAdsJob], name = "facebook_ads_job"),
    new Type(value = classOf[TikTokAdsJob], name = "tik_tok_ads_job")
  )
)
trait Job {

  /**
    *
    * @return organization id
    */

  def orgId: Long

  /** *
    *
    * @return a unique id for Job
    */
  def jobId: JobId

  /** *
    *
    * @return name of job
    */
  def displayName: String

  /** *
    *
    * @return job's type, example: Database Sync, Service Sync, Remote File Sync, etc ...
    */
  @JsonScalaEnumeration(classOf[JobTypeRef])
  def jobType: JobType

  /**
    *
    * @return username who create job
    */
  def creatorId: String

  /**
    *
    * @return last datetime job was edit
    */
  def lastModified: Long

  /**
    *
    * @return job's sync mechanism
    */
  @JsonScalaEnumeration(classOf[SyncModeRef])
  def syncMode: SyncMode

  /** *
    *
    * @return datasource for job
    */

  def sourceId: SourceId

  /** *
    *
    * @return the last time this job successful sync
    */

  def lastSuccessfulSync: Long

  /** *
    *
    * @return the default interval in minute for next sync
    */

  def syncIntervalInMn: Int

  /** *
    *
    * @return last synced status (status when complete: success or fail), not the status when syncing
    *         TODO: to be supported: partially synced, synced ... lines, error when ...
    */
  @JsonScalaEnumeration(classOf[JobStatusRef])
  def lastSyncStatus: JobStatus

  /** *
    *
    * @return current sync status
    */
  @JsonScalaEnumeration(classOf[JobStatusRef])
  def currentSyncStatus: JobStatus

  /**
    *
    * @return time schedule to run job (ex: schedule once at 10:00:00 10/06/2021, schedule daily at 10:00:00 every 2 day)
    */
  def scheduleTime: ScheduleTime

  /***
    * @return data for this job to execute by JobWorker
    */
  def jobData: Map[String, Any]

  def destDatabaseName: String

  def destTableName: String

  def customCopy(
      lastSyncStatus: JobStatus = this.lastSyncStatus,
      currentSyncStatus: JobStatus = this.currentSyncStatus,
      lastSuccessfulSync: Long = this.lastSuccessfulSync
  ): Job

  def copyJobStatus(progress: JobProgress): Job

  def copyRunTime(runTime: Long): Job

  def nextRunTime: Long

  def destinations: Seq[String]

  def toMultiJob(orgId: Long, creatorId: String, tableNames: Seq[String]): Seq[Job]
}

object JobStatus extends Enumeration {
  type JobStatus = Value
  val Init: JobStatus.Value = Value("Initialized")
  val Queued: JobStatus.Value = Value("Queued")
  val Syncing: JobStatus.Value = Value("Syncing")
  val Synced: JobStatus.Value = Value("Synced")
  val Error: JobStatus.Value = Value("Error")
  val Terminated: JobStatus.Value = Value("Terminated")
  val Canceled: JobStatus.Value = Value("Canceled")
  val Unknown: JobStatus.Value = Value("Unknown")
}

class JobStatusRef extends TypeReference[JobStatus.type]

object JobType extends Enumeration {
  type JobType = Value
  val Jdbc: JobType.Value = Value("Jdbc")
  val GenericJdbc: JobType.Value = Value("GenericJdbc")
  val S3: JobType.Value = Value("Amazon_S3")
  @deprecated("use GoogleSheetsV2 instead")
  val GoogleSheets: JobType.Value = Value("Google_Sheets")
  val GoogleSheetsV2: JobType.Value = Value("GoogleSheetsV2")
  val Ga: JobType = Value("Google_Analytics")
  val Ga4: JobType = Value("Ga4")
  val FacebookAds: JobType.Value = Value("FacebookAds")
  val Hubspot: JobType = Value("Hubspot")
  val MongoDb: JobType.Value = Value("MongoDb")
  val Bigquery: JobType.Value = Value("Bigquery")
  val Solana: JobType.Value = Value("Solana")
  val CoinMarketCap: JobType.Value = Value("CoinMarketCap")
  val Shopify: JobType.Value = Value("Shopify")
  val GoogleAds: JobType.Value = Value("GoogleAds")
  val TikTokAds: JobType.Value = Value("TikTokAds")
  val Other: JobType.Value = Value("Others")
}

class JobTypeRef extends TypeReference[JobType.type]

object SyncMode extends Enumeration {
  type SyncMode = Value
  val FullSync: SyncMode.Value = Value("FullSync")
  val IncrementalSync: SyncMode.Value = Value("IncrementalSync")
}

class SyncModeRef extends TypeReference[SyncMode.type]

object DataDestination extends Enumeration {
  type DataDestination = Value
  val Clickhouse: DataDestination.Value = Value("Clickhouse")
  val Hadoop: DataDestination.Value = Value("Hadoop")
}

class DataDestinationRef extends TypeReference[DataDestination.type]
