package co.datainsider.jobscheduler.domain

import co.datainsider.jobscheduler.domain.Ids.{JobId, SyncId}
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobStatusRef
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class JobHistory(
    syncId: SyncId = 0,
    jobId: JobId,
    jobName: String,
    lastSyncTime: Long,
    totalSyncedTime: Long,
    @JsonScalaEnumeration(classOf[JobStatusRef]) syncStatus: JobStatus,
    totalRowsInserted: Long,
    message: String = ""
)

/**
  * track progress of on-going jobs
  * job worker will report JobProcess back to Scheduler on begin job, finish job and every n rows inserted
  */
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JdbcProgress], name = "jdbc_progress"),
    new Type(value = classOf[GaProgress], name = "ga_progress"),
    new Type(value = classOf[FbAdsProgress], name = "fb_progress"),
    new Type(value = classOf[GoogleSheetProgress], name = "google_sheet_progress"),
    new Type(value = classOf[MongoProgress], name = "mongodb_progress"),
    new Type(value = classOf[BigqueryStorageProgress], name = "bigquery_storage_progress"),
    new Type(value = classOf[GenericJdbcProgress], name = "generic_jdbc_progress"),
    new Type(value = classOf[CoinMarketCapProgress], name = "coin_market_cap_progress"),
    new Type(value = classOf[SolanaProgress], name = "solana_progress"),
    new Type(value = classOf[AmazonS3Progress], name = "amazon_s3_progress"),
    new Type(value = classOf[ShopifyJobProgress], name = "shopify_job_progress"),
    new Type(value = classOf[GoogleAdsProgress], name = "google_ads_progress"),
    new Type(value = classOf[Ga4Progress], name = "ga4_progress"),
    new Type(value = classOf[FacebookAdsProgress], name = "facebook_ads_progress"),
    new Type(value = classOf[TikTokAdsProgress], name = "tik_tok_ads_progress"),
    new Type(value = classOf[ShopeeJobProgress], name = "shopee_progress"),
    new Type(value = classOf[LazadaJobProgress], name = "lazada_job_progress"),
    new Type(value = classOf[PalexyJobProgress], name = "palexy_job_progress"),
    new Type(value = classOf[GoogleJobProgress], name = "google_job_progress"),
  )
)
trait JobProgress {

  def orgId: Long

  def syncId: SyncId

  def jobId: JobId

  def updatedTime: Long

  @JsonScalaEnumeration(classOf[JobStatusRef])
  def jobStatus: JobStatus

  def totalSyncRecord: Long

  def totalExecutionTime: Long

  def progressData: Map[String, Any]

  def message: Option[String]
}

/** *
  *
  * @param jobId id of job
  * @param jobStatus current status of job
  * @param updatedTime current time at the moment of checking progress
  * @param totalSyncRecord number of synced rows
  * @param totalExecutionTime total sync time
  * @param lastSyncedValue last value that is synced
  * @param message human readable message, debug information sent by worker to dev
  */
case class JdbcProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    @JsonScalaEnumeration(classOf[JobStatusRef])
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    message: Option[String] = None,
    lastSyncedValue: String = ""
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}

case class GaProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    message: Option[String] = None,
    lastSyncedValue: String = ""
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}

case class FbAdsProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map()
}

case class HubspotProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map()
}

case class GoogleSheetProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map()
}

case class MongoProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: String,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map()
}

case class SolanaProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: String,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}

case class BigqueryStorageProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: String,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}

case class GenericJdbcProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    @JsonScalaEnumeration(classOf[JobStatusRef])
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: String,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}
case class CoinMarketCapProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    @JsonScalaEnumeration(classOf[JobStatusRef])
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: String = "",
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}

case class ShopifyJobProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    @JsonScalaEnumeration(classOf[JobStatusRef])
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: String = "",
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}

case class AmazonS3Progress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    @JsonScalaEnumeration(classOf[JobStatusRef])
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    incrementalTime: Long,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> incrementalTime)
}

case class GoogleAdsProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: String = "",
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)
}

case class Ga4Progress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: Option[String] = None,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue.getOrElse(""))
}

case class FacebookAdsProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map()
}

case class TikTokAdsProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: Option[String] = None,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue.getOrElse(""))
}

case class ShopeeJobProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: Option[String] = None,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue.getOrElse(""))
}
case class LazadaJobProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: Option[String] = None,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue.getOrElse(""))
}

case class PalexyJobProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: Option[String] = None,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue.getOrElse(""))
}

case class GoogleJobProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long,
    jobStatus: JobStatus,
    totalSyncRecord: Long,
    totalExecutionTime: Long,
    lastSyncedValue: Option[String] = None,
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue.getOrElse(""))
}
