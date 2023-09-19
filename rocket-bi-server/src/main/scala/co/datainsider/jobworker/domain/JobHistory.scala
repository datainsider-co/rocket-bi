package co.datainsider.jobworker.domain

import co.datainsider.jobworker.domain.Ids.{JobId, SyncId}
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class JobHistory(
    syncId: SyncId,
    jobId: JobId,
    lastSyncTime: Long,
    totalSyncedTime: Long,
    syncStatus: JobStatus
)

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JdbcProgress], name = "jdbc_progress"),
    new Type(value = classOf[GaProgress], name = "ga_progress"),
    new Type(value = classOf[GoogleSheetProgress], name = "google_sheet_progress"),
    new Type(value = classOf[MongoProgress], name = "mongodb_progress"),
    new Type(value = classOf[SolanaProgress], name = "solana_progress"),
    new Type(value = classOf[BigqueryStorageProgress], name = "bigquery_storage_progress"),
    new Type(value = classOf[GenericJdbcProgress], name = "generic_jdbc_progress"),
    new Type(value = classOf[CoinMarketCapProgress], name = "coin_market_cap_progress"),
    new Type(value = classOf[AmazonS3Progress], name = "amazon_s3_progress"),
    new Type(value = classOf[ShopifyJobProgress], name = "shopify_job_progress"),
    new Type(value = classOf[GoogleAdsProgress], name = "google_ads_progress"),
    new Type(value = classOf[GA4Progress], name = "ga4_progress"),
    new Type(value = classOf[FacebookAdsProgress], name = "facebook_ads_progress"),
    new Type(value = classOf[TikTokAdsProgress], name = "tik_tok_ads_progress"),
    new Type(value = classOf[ShopeeJobProgress], name = "shopee_job_progress"),
    new Type(value = classOf[LazadaJobProgress], name = "lazada_job_progress"),
    new Type(value = classOf[PalexyJobProgress], name = "palexy_job_progress"),
    new Type(value = classOf[GoogleJobProgress], name = "google_job_progress")
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

  def customCopy(jobStatus: JobStatus): JobProgress
}

/** *
  *
  * @param jobId id of job
  * @param jobStatus current status of job
  * @param updatedTime current time at the moment of checking progress
  * @param totalSyncRecord number of synced rows
  * @param totalExecutionTime total sync time
  * @param lastSyncedValue total sync time
  * @param message human readable message, debug information sent by worker to dev
  */
case class JdbcProgress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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
    lastSyncedValue: String
) extends JobProgress {
  override def progressData: Map[String, Any] =
    Map(
      "last_synced_value" -> lastSyncedValue
    )

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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
  override def progressData: Map[String, Any] = Map()

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class GenericJdbcProgress(
    orgId: Long,
    syncId: SyncId,
    jobId: JobId,
    updatedTime: Long = System.currentTimeMillis(),
    jobStatus: JobStatus = JobStatus.Init,
    totalSyncRecord: Long = 0,
    totalExecutionTime: Long = 0,
    lastSyncedValue: String = "",
    message: Option[String] = None
) extends JobProgress {
  override def progressData: Map[String, Any] = Map("last_synced_value" -> lastSyncedValue)

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class CoinMarketCapProgress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class ShopifyJobProgress(
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

  override def toString: String =
    s"ShopifyJobProgress(orgId: ${orgId}, syncId: ${syncId}, jobId: ${jobId}, updatedTime: ${updatedTime}, jobStatus: ${jobStatus}, totalSyncRecord: ${totalSyncRecord}, totalExecutionTime: ${totalExecutionTime}, lastSyncedValue: ${lastSyncedValue}, message: ${message})"

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class GA4Progress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }

  override def toString(): String = {
    s"""
      |GA4Progress {
      | orgId: $orgId,
      | syncId: $syncId,
      | jobId: $jobId,
      | updatedTime: $updatedTime,
      | jobStatus: $jobStatus,
      | totalSyncRecord: $totalSyncRecord,
      | totalExecutionTime: $totalExecutionTime,
      | lastSyncedValue: $lastSyncedValue,
      | message: $message
      |}
      |""".stripMargin
  }
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class TikTokAdsProgress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class ShopeeJobProgress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class LazadaJobProgress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class PalexyJobProgress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}

case class GoogleJobProgress(
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

  override def customCopy(jobStatus: JobStatus): JobProgress = {
    this.copy(jobStatus = jobStatus)
  }
}
