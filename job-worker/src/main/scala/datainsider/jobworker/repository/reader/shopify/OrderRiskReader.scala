package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{BoolColumn, DoubleColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

// https://shopify.dev/api/admin-rest/2022-04/resources/order-risk#top
class OrderRiskReader(
    client: ShopifySdk,
    limitSize: Int = 250
) extends ShopifyReader
    with Logging {
  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = OrderRiskReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchOrderRisks(lastSyncedValue)((orderId: String, orderRisks: Seq[JsonNode]) => {
      val records: Seq[Record] = orderRisks.map(OrderRiskReader.serialize)
      currentLatestId = ShopifyReader.max(orderId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }

  @throws[ShopifyClientException]
  private def fetchOrderRisks(lastId: Option[String])(handler: ((String, Seq[JsonNode]) => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withFields("id").withLimit(limitSize).build()
    while (true) {
      val orders: ShopifyPage[JsonNode] = client.getOrders(request)
      orders.asScala
        .filter(order => order.at("/id").isExists())
        .foreach(order => {
          val orderId: String = order.at("/id").asText()
          val orderRisks: Seq[JsonNode] = getOrderRisks(orderId)
          handler(orderId, orderRisks)
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

  @throws[ShopifyClientException]
  private def getOrderRisks(orderId: String): Seq[JsonNode] = {
    try {
      client.getOrderRisks(orderId).asScala
    } catch {
      case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
        warn(s"get order risk of ${orderId} not found")
        Seq.empty
    }
  }


}

object OrderRiskReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }
  protected val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("A unique numeric identifier for the order risk."), isNullable = true),
        "/id"
      ),
      ShopifyColumn(
        BoolColumn(
          "cause_cancel",
          "cause_cancel",
          Some("Whether this order risk is severe enough to force the cancellation of the order. "),
          isNullable = true
        ),
        "/cause_cancel"
      ),
      ShopifyColumn(
        StringColumn(
          "checkout_id",
          "checkout_id",
          Some("The ID of the checkout that the order risk belongs to."),
          isNullable = true
        ),
        "/checkout_id"
      ),
      ShopifyColumn(
        BoolColumn(
          "display",
          "display",
          Some("Whether the order risk is displayed on the order details page in the Shopify admin."),
          isNullable = true
        ),
        "/display"
      ),
      ShopifyColumn(
        StringColumn(
          "merchant_message",
          "merchant_message",
          Some(
            "The message that's displayed to the merchant to indicate the results of the fraud check. The message is displayed only if display is set to true."
          ),
          isNullable = true
        ),
        "/merchant_message"
      ),
      ShopifyColumn(
        StringColumn(
          "message",
          "message",
          Some(
            "The message that's displayed to the merchant to indicate the results of the fraud check. The message is displayed only if display is set to true."
          ),
          isNullable = true
        ),
        "/message"
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
        StringColumn(
          "recommendation",
          "recommendation",
          Some("The recommended action given to the merchant."),
          isNullable = true
        ),
        "/recommendation"
      ),
      ShopifyColumn(
        DoubleColumn(
          "score",
          "score",
          Some(
            "For internal use only. A number between 0 and 1 that's assigned to the order. The closer the score is to 1, the more likely it is that the order is fraudulent."
          ),
          isNullable = true
        ),
        "/score"
      ),
      ShopifyColumn(
        StringColumn(
          "source",
          "source",
          Some("The source of the order risk."),
          isNullable = true
        ),
        "/source"
      )
    )
}
