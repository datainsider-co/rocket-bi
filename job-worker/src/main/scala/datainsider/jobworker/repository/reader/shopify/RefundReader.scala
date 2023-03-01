package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{BoolColumn, DateTimeColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.{asScalaBufferConverter, asScalaIteratorConverter}

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/refund
class RefundReader(
    client: ShopifySdk,
    limitSize: Int = 250
) extends ShopifyReader
    with Logging {

  def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = RefundReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchRefunds(lastSyncedValue)((orderId: String, orderRefunds: Seq[JsonNode]) => {
      val records: Seq[Record] = orderRefunds.map(RefundReader.serialize)
      currentLatestId = ShopifyReader.max(orderId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }


  @throws[ShopifyClientException]
  private def fetchRefunds(lastId: Option[String])(handler: ((String, Seq[JsonNode]) => Unit)): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest
        .newBuilder()
        .withSinceId(lastId.orNull)
        .withFields("id,refunds")
        .withLimit(limitSize)
        .build()
    while (true) {
      val orders: ShopifyPage[JsonNode] = client.getOrders(request)
      orders.asScala
        .filter(_.at("/id").isExists())
        .foreach(order => {
          val orderId: String = order.at("/id").asText()
          val refunds: Seq[JsonNode] = order.at("/refunds").iterator().asScala.toSeq
          handler(orderId, refunds)
        })
      // end of page
      if (orders.isEmpty || orders.getNextPageInfo == null) {
        return;
      } else {
        // fetch next page, must reset
        request.setSinceId(null)
        request.setPageInfo(orders.getNextPageInfo)
      }

    }
  }
}

object RefundReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] = Array[ShopifyColumn](
    ShopifyColumn(
      Int64Column("id", "id", Some("The unique identifier for the refund."), isNullable = true),
      "/id"
    ),
    ShopifyColumn(
      Int64Column(
        "order_id",
        "order_id",
        Some("The ID of the order that the order risk belongs to."),
        isNullable = true
      ),
      "/order_id"
    ),
    ShopifyColumn(
      BoolColumn(
        "user_id",
        "user_id",
        Some("The unique identifier of the user who performed the refund."),
        isNullable = true
      ),
      "/user_id"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "created_at",
        "created_at",
        Some("The date and time (ISO 8601 format) when the refund was created."),
        isNullable = true
      ),
      "/created_at"
    ),
    ShopifyColumn(
      StringColumn(
        "duties",
        "duties",
        Some("A list of duties that have been reimbursed as part of the refund."),
        isNullable = true
      ),
      "/duties"
    ),
    ShopifyColumn(
      StringColumn(
        "note",
        "note",
        Some("An optional note attached to a refund."),
        isNullable = true
      ),
      "/note"
    ),
    ShopifyColumn(
      StringColumn(
        "order_adjustments",
        "order_adjustments",
        Some(
          "A list of order adjustments attached to the refund."
        ),
        isNullable = true
      ),
      "/order_adjustments"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "processed_at",
        "processed_at",
        Some("The date and time (ISO 8601 format) when the refund was imported."),
        isNullable = true
      ),
      "/processed_at"
    ),
    ShopifyColumn(
      StringColumn(
        "refund_duties",
        "refund_duties",
        Some(
          "A list of refunded duties."
        ),
        isNullable = true
      ),
      "/refund_duties"
    ),
    ShopifyColumn(
      StringColumn(
        "refund_line_items",
        "refund_line_items",
        Some("A list of refunded line items."),
        isNullable = true
      ),
      "/refund_line_items"
    ),
    ShopifyColumn(
      BoolColumn(
        "restock",
        "restock",
        Some("Whether to add the line items back to the store's inventory."),
        isNullable = true
      ),
      "/restock"
    ),
    ShopifyColumn(
      StringColumn(
        "transactions",
        "transactions",
        Some("A list of transactions involved in the refund. "),
        isNullable = true
      ),
      "/transactions"
    )
  )
}
