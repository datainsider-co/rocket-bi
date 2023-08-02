package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{BoolColumn, DateTimeColumn, Int64Column, StringColumn}
import co.datainsider.bi.client.JdbcClient.Record
import ShopifyReader.ImplicitJsonNode

import scala.jdk.CollectionConverters.{asScalaBufferConverter, asScalaIteratorConverter}

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/fulfillment#resource-object
class FulfillmentReader(
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
      columns = FulfillmentReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(reportData: (Seq[Record], String) => Unit) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchFulfillments(lastSyncedValue)((orderId: String, fulfillments: Seq[JsonNode]) => {
      val records: Seq[Record] = fulfillments.map(FulfillmentReader.serialize)
      currentLatestId = ShopifyReader.max(orderId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }

  @throws[ShopifyClientException]
  private def fetchFulfillments(lastId: Option[String])(handler: ((String, Seq[JsonNode]) => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest
      .newBuilder()
      .withSinceId(lastId.orNull)
      .withFields("id,fulfillments")
      .withLimit(limitSize)
      .build()
    while (true) {
      val orders: ShopifyPage[JsonNode] = client.getOrders(request)
      orders.asScala
        .filter(order => order.at("/id").isExists())
        .foreach(order => {
          val fulfillments: JsonNode = order.at("/fulfillments")
          if (fulfillments.isArray) {
            handler(order.at("/id").asText(), fulfillments.iterator().asScala.toSeq)
          }
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

object FulfillmentReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("The ID for the fulfillment."), isNullable = true),
        "/id"
      ),
      new ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time when the fulfillment was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          "line_items",
          "line_items",
          Some("A list of the fulfillment's line items"),
          isNullable = true
        ),
        "/line_items"
      ),
      new ShopifyColumn(
        StringColumn(
          "location_id",
          "location_id",
          Some("The unique identifier of the location that the fulfillment was processed at."),
          isNullable = true
        ),
        "/location_id"
      ),
      new ShopifyColumn(
        StringColumn(
          "name",
          "name",
          Some("The uniquely identifying fulfillment name, consisting of two parts separated by a ."),
          isNullable = true
        ),
        "/name"
      ),
      new ShopifyColumn(
        BoolColumn(
          "notify_customer",
          "notify_customer",
          Some(
            "Whether the customer should be notified. If set to true, then an email will be sent when the fulfillment is created or updated. "
          ),
          isNullable = true
        ),
        "/notify_customer"
      ),
      new ShopifyColumn(
        Int64Column(
          "order_id",
          "order_id",
          Some("The unique numeric identifier for the order."),
          isNullable = true
        ),
        "/order_id"
      ),
      new ShopifyColumn(
        StringColumn(
          "origin_address",
          "origin_address",
          Some("The address from which the fulfillment occurred"),
          isNullable = true
        ),
        "/origin_address"
      ),
      new ShopifyColumn(
        StringColumn(
          "receipt",
          "receipt",
          Some(
            "A text field that provides information about the receipt."
          ),
          isNullable = true
        ),
        "/receipt"
      ),
      new ShopifyColumn(
        StringColumn(
          "service",
          "service",
          Some(
            "The fulfillment service associated with the fulfillment."
          ),
          isNullable = true
        ),
        "/service"
      ),
      new ShopifyColumn(
        StringColumn(
          "shipment_status",
          "shipment_status",
          Some(
            "The current shipment status of the fulfillment."
          ),
          isNullable = true
        ),
        "/shipment_status"
      ),
      new ShopifyColumn(
        StringColumn(
          "status",
          "status",
          Some("The status of the fulfillment."),
          isNullable = true
        ),
        "/status"
      ),
      new ShopifyColumn(
        StringColumn(
          "tracking_company",
          "tracking_company",
          Some(
            "The name of the tracking company. The following tracking companies display for shops located in any country."
          ),
          isNullable = true
        ),
        "/tracking_company"
      ),
      new ShopifyColumn(
        StringColumn(
          "tracking_numbers",
          "tracking_numbers",
          Some(
            "A list of tracking numbers, provided by the shipping company."
          ),
          isNullable = true
        ),
        "/tracking_numbers"
      ),
      new ShopifyColumn(
        StringColumn(
          "tracking_urls",
          "tracking_urls",
          Some(
            "The URLs of tracking pages for the fulfillment."
          ),
          isNullable = true
        ),
        "/tracking_urls"
      ),
      new ShopifyColumn(
        StringColumn(
          "tracking_url",
          "tracking_url",
          Some(
            "The URL of tracking pages for the fulfillment."
          ),
          isNullable = true
        ),
        "/tracking_url"
      ),
      new ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the order was last modified."),
          isNullable = true
        ),
        "/updated_at"
      ),
      new ShopifyColumn(
        StringColumn(
          "variant_inventory_management",
          "variant_inventory_management",
          Some("The name of the inventory management service."),
          isNullable = true
        ),
        "/variant_inventory_management"
      )
    )
}
