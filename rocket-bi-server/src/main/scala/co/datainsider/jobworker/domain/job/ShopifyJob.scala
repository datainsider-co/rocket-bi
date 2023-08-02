package co.datainsider.jobworker.domain.job

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode
import ShopifyTable.ShopifyTable
import co.datainsider.jobworker.domain.{Job, JobType, SyncMode}

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
