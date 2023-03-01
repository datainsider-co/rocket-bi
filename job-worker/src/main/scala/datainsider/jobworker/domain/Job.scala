package datainsider.jobworker.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleTime}
import datainsider.client.domain.schema.TableSchema
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SourceId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain.JobType.JobType
import datainsider.jobworker.domain.ShopifyTable.ShopifyTable
import datainsider.jobworker.domain.SyncMode.SyncMode
import datainsider.jobworker.domain.job.{FacebookAdsJob, Ga4Job, GaJob, TikTokAdsJob}

object JobStatus extends Enumeration {
  type JobStatus = Value
  val Init: JobStatus.Value = Value("Initialized")
  val Queued: JobStatus.Value = Value("Queued")
  val Syncing: JobStatus.Value = Value("Syncing")
  val Synced: JobStatus.Value = Value("Synced")
  val Error: JobStatus.Value = Value("Error")
  val Terminated: JobStatus.Value = Value("Terminated")
  val Unknown: JobStatus.Value = Value("Unknown")
}

class JobStatusRef extends TypeReference[JobStatus.type]

object JobType extends Enumeration {
  type JobType = Value
  val Jdbc: JobType.Value = Value("Jdbc")
  val GenericJdbc: JobType.Value = Value("GenericJdbc")
  val S3: JobType.Value = Value("Amazon_S3")
  val GoogleSheets: JobType.Value = Value("Google_Sheets")
  val Ga: JobType.Value = Value("Google_Analytics")
  val FacebookAds: JobType.Value = Value("FacebookAds")
  val Bigquery: JobType.Value = Value("Bigquery")
  val Hubspot: JobType.Value = Value("Hubspot")
  val MongoDb: JobType.Value = Value("MongoDb")
  val CoinMarketCap: JobType.Value = Value("CoinMarketCap")
  val Other: JobType.Value = Value("Others")
  val Solana: JobType.Value = Value("Solana")
  val GoogleAds: JobType.Value = Value("GoogleAds")
  val Shopify: JobType.Value = Value("Shopify")
  val Ga4: JobType.Value = Value("Ga4")
  val TikTokAds: JobType.Value = Value("TikTokAds")
}

class JobTypeRef extends TypeReference[JobType.type]

object SyncMode extends Enumeration {
  type SyncMode = Value
  val FullSync: SyncMode.Value = Value("FullSync")
  val IncrementalSync: SyncMode.Value = Value("IncrementalSync")
}

class SyncModeRef extends TypeReference[SyncMode.type]

object DataDestination extends Enumeration {
  type DataDestination = String
  val Clickhouse: DataDestination = "Clickhouse"
  val Hadoop: DataDestination = "Hadoop"
}

class DataDestinationRef extends TypeReference[DataDestination.type]

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

case class JdbcJob(
    orgId: Long = -1,
    jobId: Int,
    jobType: JobType = JobType.Jdbc,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String = "",
    destTableName: String = "",
    destinations: Seq[DataDestination],
    databaseName: String,
    tableName: String,
    incrementalColumn: Option[String],
    lastSyncedValue: String,
    maxFetchSize: Int,
    query: Option[String]
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class GoogleSheetJob(
    orgId: Long = -1,
    jobId: Int,
    displayName: String,
    jobType: JobType = JobType.GoogleSheets,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    spreadSheetId: String,
    sheetId: Int,
    schema: TableSchema,
    includeHeader: Boolean = false,
    accessToken: String,
    refreshToken: String
) extends Job {

  /**   *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class TokenResponse(accessToken: String, scope: String, tokenType: String, expiresIn: String, refreshToken: String)

case class MongoJob(
    orgId: Long = -1,
    jobId: Int,
    displayName: String,
    jobType: JobType = JobType.MongoDb,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    databaseName: String,
    tableName: String,
    flattenDepth: Int,
    incrementalColumn: Option[String],
    lastSyncedValue: String,
    maxFetchSize: Int,
    destinations: Seq[DataDestination] = Seq()
) extends Job {

  /**   *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class BigQueryStorageJob(
    orgId: Long = -1,
    jobId: Int,
    displayName: String,
    jobType: JobType = JobType.Bigquery,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    projectName: String,
    datasetName: String,
    tableName: String,
    selectedColumns: Seq[String],
    rowRestrictions: String,
    incrementalColumn: Option[String],
    lastSyncedValue: String
) extends Job {
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class GenericJdbcJob(
    orgId: Long = -1,
    jobId: Int,
    jobType: JobType = JobType.GenericJdbc,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String = "",
    destTableName: String = "",
    destinations: Seq[DataDestination],
    databaseName: String,
    tableName: String,
    incrementalColumn: Option[String],
    lastSyncedValue: String,
    maxFetchSize: Int,
    query: Option[String]
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class CoinMarketCapJob(
    orgId: Long,
    jobId: Int = 0,
    displayName: String,
    jobType: JobType = JobType.CoinMarketCap,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    nextRunTime: Long = System.currentTimeMillis(),
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    apiKey: String
) extends Job {

  /**   *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class AmazonS3Job(
    orgId: Long = -1,
    jobId: Int,
    displayName: String,
    jobType: JobType = JobType.S3,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    nextRunTime: Long = System.currentTimeMillis(),
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    bucketName: String,
    fileConfig: FileConfig,
    folderPath: String = "",
    incrementalTime: Long,
    tableSchema: Option[TableSchema] = None
) extends Job {

  /**   *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class SolanaJob(
    orgId: Long = -1,
    jobId: Int,
    jobType: JobType = JobType.Solana,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String = "",
    destTableName: String = "",
    destinations: Seq[DataDestination],
    destTransactionTable: String,
    destRewardTable: String,
    lastSyncedValue: String,
    retryTime: Int = 3,
    // can skip sync when error
    isSkip: Boolean = true
) extends Job {
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

case class ShopifyJob(
    orgId: Long = -1,
    jobId: Int,
    jobType: JobType = JobType.Shopify,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String = "",
    destTableName: String = "",
    destinations: Seq[DataDestination],
    @JsonScalaEnumeration(classOf[ShopifyTableRef])
    tableName: ShopifyTable,
    lastSyncedValue: String
) extends Job {
  override def jobData: String = ""

  /**
    * @return
    * Some when syncMode is SyncMode.IncrementalSync and last sync value is not empty
    * Otherwise return None
    */
  def getLastSyncedValue(): Option[String] = {
    if (syncMode == SyncMode.IncrementalSync && lastSyncedValue != null && lastSyncedValue.nonEmpty) {
      Some(lastSyncedValue)
    } else {
      None
    }
  }

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

object ShopifyTable extends Enumeration {
  type ShopifyTable = Value
  val Report: ShopifyTable = Value("report")
  val Customer: ShopifyTable = Value("customer")
  val Order: ShopifyTable = Value("order")
  val OrderTransaction: ShopifyTable = Value("order_transaction")
  val OrderRisk: ShopifyTable = Value("order_risk")
  val Refund: ShopifyTable = Value("refund")
  val DraftOrder: ShopifyTable = Value("draft_order")
  val AbandonedCheckout: ShopifyTable = Value("abandoned_checkout")
  val Fulfillment: ShopifyTable = Value("fulfillment")
  val FulfillmentOrder: ShopifyTable = Value("fulfillment_order")
  val Product: ShopifyTable = Value("product")
  val ProductImage: ShopifyTable = Value("product_image")
  val ProductVariant: ShopifyTable = Value("product_variant")
  val Collection: ShopifyTable = Value("collection")
  val SmartCollection: ShopifyTable = Value("smart_collection")
  val CustomCollection: ShopifyTable = Value("custom_collection")
  val PriceRule: ShopifyTable = Value("price_rule")
  val DiscountCode: ShopifyTable = Value("discount_code")
  val Event: ShopifyTable = Value("event")
  val Location: ShopifyTable = Value("location")
  val InventoryLevel: ShopifyTable = Value("inventory_level")
  val InventoryItem: ShopifyTable = Value("inventory_item")
  val MarketingEvent: ShopifyTable = Value("marketing_event")
  val MetaField: ShopifyTable = Value("meta_field")
  val Blog: ShopifyTable = Value("blog")
  val Article: ShopifyTable = Value("article")
  val Comment: ShopifyTable = Value("comment")
  val Page: ShopifyTable = Value("page")
  val Theme: ShopifyTable = Value("theme")
  val Asset: ShopifyTable = Value("asset")
  val Redirect: ShopifyTable = Value("redirect")
  val ScripTag: ShopifyTable = Value("scrip_tag")
  val TenderTransaction: ShopifyTable = Value("tender_transaction")
  val CustomerAddress: ShopifyTable = Value("customer_address")
  // only in shopify_plus
  val GiftCard: ShopifyTable = Value("gift_card")
  val User: ShopifyTable = Value("user")
}

class ShopifyTableRef extends TypeReference[ShopifyTable.type]

case class GoogleAdsJob(
    orgId: Long = -1,
    jobId: Int,
    jobType: JobType = JobType.GoogleAds,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    customerId: String,
    resourceName: String,
    incrementalColumn: Option[String],
    lastSyncedValue: String,
    startDate: Option[String],
    query: Option[String]
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}
