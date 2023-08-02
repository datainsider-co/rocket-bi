package co.datainsider.jobworker.domain

import co.datainsider.jobworker.domain.job.{AmazonS3Job, BigQueryStorageJob, CoinMarketCapJob, FacebookAdsJob, Ga4Job, GaJob, GenericJdbcJob, GoogleAdsJob, GoogleSheetJob, LazadaJob, MongoJob, PalexyJob, ShopeeJob, ShopifyJob, SolanaJob, TikTokAdsJob}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import DataDestination.DataDestination
import Ids.SourceId
import JobStatus.JobStatus
import JobType.JobType
import SyncMode.SyncMode

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JdbcJob], name = "jdbc_job"),
    new Type(value = classOf[GaJob], name = "ga_job"),
    new Type(value = classOf[GoogleSheetJob], name = "google_sheets_job"),
    new Type(value = classOf[MongoJob], name = "mongo_db_job"),
    new Type(value = classOf[BigQueryStorageJob], name = "bigquery_storage_job"),
    new Type(value = classOf[GenericJdbcJob], name = "generic_jdbc_job"),
    new Type(value = classOf[SolanaJob], name = "solana_job"),
    new Type(value = classOf[CoinMarketCapJob], name = "coin_market_cap_job"),
    new Type(value = classOf[AmazonS3Job], name = "amazon_s3_job"),
    new Type(value = classOf[ShopifyJob], name = "shopify_job"),
    new Type(value = classOf[GoogleAdsJob], name = "google_ads_job"),
    new Type(value = classOf[Ga4Job], name = "ga4_job"),
    new Type(value = classOf[FacebookAdsJob], name = "facebook_ads_job"),
    new Type(value = classOf[TikTokAdsJob], name = "tik_tok_ads_job"),
    new Type(value = classOf[ShopeeJob], name = "shopee_job"),
    new Type(value = classOf[LazadaJob], name = "lazada_job"),
    new Type(value = classOf[PalexyJob], name = "palexy_job")
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
  def jobId: Int

  /** *
    *
    * @return job's type, example: Database Sync, Service Sync, Remote File Sync, etc ...
    */
  @JsonScalaEnumeration(classOf[JobTypeRef])
  def jobType: JobType

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
    * @return last synced status,
    */
  @JsonScalaEnumeration(classOf[JobStatusRef])
  def lastSyncStatus: JobStatus

  /** *
    *
    * @return current sync status
    */
  @JsonScalaEnumeration(classOf[JobStatusRef])
  def currentSyncStatus: JobStatus

  /***
    * @return data for this job to execute by JobWorker
    */
  def jobData: String

  def destDatabaseName: String

  def destTableName: String

  def destinations: Seq[DataDestination]

  def copyWith(
      orgId: Long = orgId,
      jobId: Int = jobId,
      jobType: JobType = jobType,
      syncMode: SyncMode = syncMode,
      sourceId: SourceId = sourceId,
      lastSuccessfulSync: Long = lastSuccessfulSync,
      syncIntervalInMn: Int = syncIntervalInMn,
      lastSyncStatus: JobStatus = lastSyncStatus,
      currentSyncStatus: JobStatus = currentSyncStatus,
      jobData: String = jobData,
      destDatabaseName: String = destDatabaseName,
      destTableName: String = destTableName,
      destinations: Seq[DataDestination] = destinations
  ): Job
}
