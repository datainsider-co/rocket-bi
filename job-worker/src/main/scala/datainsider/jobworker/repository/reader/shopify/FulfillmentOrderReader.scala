package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/fulfillmentorder#get-orders-order-id-fulfillment-orders
class FulfillmentOrderReader(
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
      columns = FulfillmentOrderReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchFulfillmentOrders(lastSyncedValue)((orderId: String, fulfillmentOrders: Seq[JsonNode]) => {
      val records: Seq[Record] = fulfillmentOrders.map(FulfillmentOrderReader.serialize)
      currentLatestId = ShopifyReader.max(orderId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }


  @throws[ShopifyClientException]
  private def fetchFulfillmentOrders(lastId: Option[String])(handler: ((String, Seq[JsonNode]) => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withFields("id").withLimit(limitSize).build()
    while (true) {
      val orders: ShopifyPage[JsonNode] = client.getOrders(request)
      orders.asScala
        .filter(order => order.at("/id").isExists())
        .foreach(order => {
          val id: String = order.at("/id").asText()
          val fulfilmentOrders: Seq[JsonNode] = getFulfillmentOrders(id);
          handler(id, fulfilmentOrders)
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

  private def getFulfillmentOrders(orderId: String): Seq[JsonNode] = {
    try {
      client.getFulfillmentOrders(orderId).asScala
    } catch {
      case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
        warn(s"get fulfillment orders of order ${orderId} not found")
        Seq.empty
    }
  }
}

object FulfillmentOrderReader {

  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("An ID for the fulfillment order."), isNullable = true),
        "/id"
      ),
      ShopifyColumn(
        Int64Column(
          "assigned_location_id",
          "assigned_location_id",
          Some("The ID of the location that has been assigned to do the work."),
          isNullable = true
        ),
        "/assigned_location_id"
      ),
      ShopifyColumn(
        StringColumn(
          "destination",
          "destination",
          Some("The destination where the items should be sent."),
          isNullable = true
        ),
        "/destination"
      ),
      ShopifyColumn(
        StringColumn(
          "delivery_method",
          "delivery_method",
          Some("The type of method used to transfer a product or service to a customer."),
          isNullable = true
        ),
        "/delivery_method"
      ),
      ShopifyColumn(
        StringColumn(
          "fulfill_at",
          "fulfill_at",
          Some("The date and time at which the fulfillment order will be fulfillable."),
          isNullable = true
        ),
        "/fulfill_at"
      ),
      ShopifyColumn(
        StringColumn(
          "fulfill_by",
          "fulfill_by",
          Some("The latest date and time by which all items in the fulfillment order need to be fulfilled."),
          isNullable = true
        ),
        "/fulfill_by"
      ),
      ShopifyColumn(
        StringColumn(
          "fulfillment_holds",
          "fulfillment_holds",
          Some("Represents the fulfillment holds applied on the fulfillment order."),
          isNullable = true
        ),
        "/fulfillment_holds"
      ),
      ShopifyColumn(
        StringColumn(
          "international_duties",
          "international_duties",
          Some("The international duties relevant to the fulfillment order.\n\n"),
          isNullable = true
        ),
        "/international_duties"
      ),
      ShopifyColumn(
        StringColumn(
          "line_items",
          "line_items",
          Some("Represents line items belonging to a fulfillment order"),
          isNullable = true
        ),
        "/line_items"
      ),
      ShopifyColumn(
        Int64Column(
          "order_id",
          "order_id",
          Some("The ID of the order that's associated with the fulfillment order."),
          isNullable = true
        ),
        "/order_id"
      ),
      ShopifyColumn(
        StringColumn(
          "request_status",
          "request_status",
          Some("The request status of the fulfillment order."),
          isNullable = true
        ),
        "/request_status"
      ),
      ShopifyColumn(
        Int64Column(
          "shop_id",
          "shop_id",
          Some("The ID of the shop that's associated with the fulfillment order."),
          isNullable = true
        ),
        "/shop_id"
      ),
      ShopifyColumn(
        StringColumn(
          "status",
          "status",
          Some("The status of the fulfillment order."),
          isNullable = true
        ),
        "/status"
      ),
      ShopifyColumn(
        StringColumn(
          "supported_actions",
          "supported_actions",
          Some("The actions that can be performed on this fulfillment order."),
          isNullable = true
        ),
        "/supported_actions"
      ),
      ShopifyColumn(
        StringColumn(
          "merchant_requests",
          "merchant_requests",
          Some("A list of requests sent by the merchant to the fulfillment service for this fulfillment order."),
          isNullable = true
        ),
        "/merchant_requests"
      ),
      ShopifyColumn(
        StringColumn(
          "assigned_location",
          "assigned_location",
          Some("The fulfillment order's assigned location. This is the location expected to perform fulfillment."),
          isNullable = true
        ),
        "/assigned_location"
      )
    )
}
