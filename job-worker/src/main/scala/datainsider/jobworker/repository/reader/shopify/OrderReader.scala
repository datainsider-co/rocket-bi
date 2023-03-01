package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

//https://shopify.dev/api/admin-rest/2022-04/resources/order
class OrderReader(
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
      columns = OrderReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchOrders(lastSyncedValue)((orders: Seq[JsonNode]) => {
      if (orders.nonEmpty) {
        val records: Seq[Record] = orders.map(OrderReader.serialize)
        val orderIds: Seq[String] = orders.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(orderIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchOrders(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val orders: ShopifyPage[JsonNode] = client.getOrders(request)
      handler(orders.asScala)

      if (orders.isEmpty || orders.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(orders.getNextPageInfo)
      }

    }
  }
}

object OrderReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => {
      ShopifyJsonParser.parse(shopifyColumn, data)
    })
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] = Array[ShopifyColumn](
    ShopifyColumn(
      Int64Column("id", "id", Some("The ID of the order, used for API purposes."), isNullable = true),
      "/id"
    ),
    ShopifyColumn(
      Int64Column("app_id", "app_id", Some("The ID of the app that created the order."), isNullable = true),
      "/app_id"
    ),
    ShopifyColumn(StringColumn("name", "name", Some("The order name"), isNullable = true), "/name"),
    ShopifyColumn(
      StringColumn(
        "billing_address",
        "billing_address",
        Some("The mailing address associated with the payment method."),
        isNullable = true
      ),
      "/billing_address"
    ),
    ShopifyColumn(
      StringColumn(
        "browser_ip",
        "browser_ip",
        Some(
          "The IP address of the browser used by the customer when they placed the order. Both IPv4 and IPv6 are supported."
        ),
        isNullable = true
      ),
      "/browser_ip"
    ),
    ShopifyColumn(
      BoolColumn(
        "buyer_accepts_marketing",
        "buyer_accepts_marketing",
        Some("Whether the customer consented to receive email updates from the shop."),
        isNullable = true
      ),
      "/buyer_accepts_marketing"
    ),
    ShopifyColumn(
      StringColumn("cancel_reason", "cancel_reason", Some("The reason why the order was canceled."), isNullable = true),
      "/cancel_reason"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "cancelled_at",
        "cancelled_at",
        Some("The date and time when the order was canceled. Returns null if the order isn't canceled."),
        isNullable = true
      ),
      "/cancelled_at"
    ),
    ShopifyColumn(
      StringColumn(
        "cart_token",
        "cart_token",
        Some("A unique value when referencing the cart that's associated with the order."),
        isNullable = true
      ),
      "/cart_token"
    ),
    ShopifyColumn(
      StringColumn(
        "checkout_token",
        "checkout_token",
        Some("A unique value when referencing the checkout that's associated with the order."),
        isNullable = true
      ),
      "/checkout_token"
    ),
    ShopifyColumn(
      StringColumn(
        "client_details",
        "client_details",
        Some("Information about the browser that the customer used when they placed their order"),
        isNullable = true
      ),
      "/client_details"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "closed_at",
        "closed_at",
        Some("The date and time (ISO 8601 format) when the order was closed. Returns null if the order isn't closed."),
        isNullable = true
      ),
      "/closed_at"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "created_at",
        "created_at",
        Some(
          "The autogenerated date and time (ISO 8601 format) when the order was created in Shopify. The value for this property cannot be changed."
        ),
        isNullable = true
      ),
      "/created_at"
    ),
    ShopifyColumn(
      StringColumn(
        "currency",
        "currency",
        Some("The three-letter code (ISO 4217 format) for the shop currency."),
        isNullable = true
      ),
      "/currency"
    ),
    ShopifyColumn(
      DoubleColumn(
        "current_total_discounts",
        "current_total_discounts",
        Some(
          "The current total discounts on the order in the shop currency. The value of this field reflects order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_total_discounts"
    ),
    ShopifyColumn(
      StringColumn(
        "current_total_discounts_set",
        "current_total_discounts_set",
        Some(
          "The current total discounts on the order in shop and presentment currencies. The amount values associated with this field reflect order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_total_discounts_set"
    ),
    ShopifyColumn(
      StringColumn(
        "current_total_duties_set",
        "current_total_duties_set",
        Some(
          "The current total duties charged on the order in shop and presentment currencies. The amount values associated with this field reflect order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_total_duties_set"
    ),
    ShopifyColumn(
      DoubleColumn(
        "current_total_price",
        "current_total_price",
        Some(
          "The current total price of the order in the shop currency. The value of this field reflects order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_total_price"
    ),
    ShopifyColumn(
      StringColumn(
        "current_total_price_set",
        "current_total_price_set",
        Some(
          "The current total price of the order in shop and presentment currencies. The amount values associated with this field reflect order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_total_price_set"
    ),
    ShopifyColumn(
      DoubleColumn(
        "current_subtotal_price",
        "current_subtotal_price",
        Some(
          "The current subtotal price of the order in the shop currency. The value of this field reflects order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_subtotal_price"
    ),
    ShopifyColumn(
      StringColumn(
        "current_subtotal_price_set",
        "current_subtotal_price_set",
        Some(
          "The current subtotal price of the order in shop and presentment currencies. The amount values associated with this field reflect order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_subtotal_price_set"
    ),
    ShopifyColumn(
      StringColumn(
        "current_total_tax",
        "current_total_tax",
        Some(
          "The current total taxes charged on the order in the shop currency. The value of this field reflects order edits, returns, or refunds."
        ),
        isNullable = true
      ),
      "/current_total_tax"
    ),
    ShopifyColumn(
      StringColumn(
        "current_total_tax_set",
        "current_total_tax_set",
        Some(
          "The current total taxes charged on the order in shop and presentment currencies. The amount values associated with this field reflect order edits, returns, and refunds."
        ),
        isNullable = true
      ),
      "/current_total_tax_set"
    ),
    ShopifyColumn(
      Int64Column("customer_id", "customer_id", Some("The customer id"), isNullable = true),
      "/customer/id"
    ),
    ShopifyColumn(
      StringColumn(
        "customer_locale",
        "customer_locale",
        Some("The two or three-letter language code, optionally followed by a region modifier."),
        isNullable = true
      ),
      "/customer_locale"
    ),
    ShopifyColumn(
      StringColumn(
        "discount_applications",
        "discount_applications",
        Some("An ordered list of stacked discount applications."),
        isNullable = true
      ),
      "/discount_applications"
    ),
    ShopifyColumn(
      StringColumn(
        "discount_codes",
        "discount_codes",
        Some("A list of discounts applied to the order."),
        isNullable = true
      ),
      "/discount_codes"
    ),
    ShopifyColumn(
      StringColumn("email", "email", Some("The customer's email address."), isNullable = true),
      "/email"
    ),
    ShopifyColumn(
      BoolColumn(
        "estimated_taxes",
        "estimated_taxes",
        Some("Whether taxes on the order are estimated."),
        isNullable = true
      ),
      "/estimated_taxes"
    ),
    ShopifyColumn(
      StringColumn(
        "financial_status",
        "financial_status",
        Some("The status of payments associated with the order."),
        isNullable = true
      ),
      "/financial_status"
    ),
    ShopifyColumn(
      StringColumn(
        "fulfillments",
        "fulfillments",
        Some("An array of fulfillments associated with the order."),
        isNullable = true
      ),
      "/fulfillments"
    ),
    ShopifyColumn(
      StringColumn(
        "fulfillment_status",
        "fulfillment_status",
        Some("The order's status in terms of fulfilled line items."),
        isNullable = true
      ),
      "/fulfillment_status"
    ),
    ShopifyColumn(
      StringColumn("gateway", "gateway", Some("The payment gateway used."), isNullable = true),
      "/gateway"
    ),
    ShopifyColumn(
      StringColumn(
        "landing_site",
        "landing_site",
        Some("The URL for the page where the buyer landed when they entered the shop."),
        isNullable = true
      ),
      "/landing_site"
    ),
    ShopifyColumn(
      StringColumn(
        "line_items",
        "line_items",
        Some("A list of line item objects, each containing information about an item in the order"),
        isNullable = true
      ),
      "/line_items"
    ),
    ShopifyColumn(
      StringColumn(
        "location_id",
        "location_id",
        Some("The ID of the physical location where the order was processed."),
        isNullable = true
      ),
      "/location_id"
    ),
    ShopifyColumn(
      StringColumn(
        "note",
        "note",
        Some("An optional note that a shop owner can attach to the order."),
        isNullable = true
      ),
      "/note"
    ),
    ShopifyColumn(
      StringColumn(
        "note_attributes",
        "note_attributes",
        Some("Extra information that is added to the order."),
        isNullable = true
      ),
      "/note_attributes"
    ),
    ShopifyColumn(
      Int64Column(
        "number",
        "number",
        Some("The order's position in the shop's count of orders. Numbers are sequential and start at 1."),
        isNullable = true
      ),
      "/number"
    ),
    ShopifyColumn(
      Int64Column(
        "order_number",
        "order_number",
        Some("The order 's position in the shop's count of orders starting at 1001"),
        isNullable = true
      ),
      "/order_number"
    ),
    ShopifyColumn(
      StringColumn(
        "original_total_duties_set",
        "original_total_duties_set",
        Some("The original total duties charged on the order in shop and presentment currencies."),
        isNullable = true
      ),
      "/original_total_duties_set"
    ),
    ShopifyColumn(
      StringColumn(
        "payment_details",
        "payment_details",
        Some("An object containing information about the payment."),
        isNullable = true
      ),
      "/payment_details"
    ),
    ShopifyColumn(
      StringColumn(
        "payment_terms",
        "payment_terms",
        Some("The terms and conditions under which a payment should be processed."),
        isNullable = true
      ),
      "/payment_terms"
    ),
    ShopifyColumn(
      StringColumn(
        "payment_gateway_names",
        "payment_gateway_names",
        Some("The list of payment gateways used for the order."),
        isNullable = true
      ),
      "/payment_gateway_names"
    ),
    ShopifyColumn(
      StringColumn(
        "phone",
        "phone",
        Some("The customer's phone number for receiving SMS notifications."),
        isNullable = true
      ),
      "/phone"
    ),
    ShopifyColumn(
      StringColumn(
        "presentment_currency",
        "presentment_currency",
        Some("The presentment currency that was used to display prices to the customer."),
        isNullable = true
      ),
      "/presentment_currency"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "processed_at",
        "processed_at",
        Some("The date and time (ISO 8601 format) when an order was processed."),
        isNullable = true
      ),
      "/processed_at"
    ),
    ShopifyColumn(
      StringColumn("processing_method", "processing_method", Some("How the payment was processed."), isNullable = true),
      "/processing_method"
    ),
    ShopifyColumn(
      StringColumn(
        "referring_site",
        "referring_site",
        Some("The website where the customer clicked a link to the shop."),
        isNullable = true
      ),
      "/referring_site"
    ),
    ShopifyColumn(
      StringColumn("refunds", "refunds", Some("A list of refunds applied to the order."), isNullable = true),
      "/refunds"
    ),
    ShopifyColumn(
      StringColumn(
        "shipping_address",
        "shipping_address",
        Some("The mailing address to where the order will be shipped."),
        isNullable = true
      ),
      "/shipping_address"
    ),
    ShopifyColumn(
      StringColumn(
        "shipping_lines",
        "shipping_lines",
        Some("An array of objects, each of which details a shipping method used."),
        isNullable = true
      ),
      "/shipping_lines"
    ),
    ShopifyColumn(
      StringColumn("source_name", "source_name", Some("The source of the checkout."), isNullable = true),
      "/source_name"
    ),
    ShopifyColumn(
      StringColumn(
        "source_identifier",
        "source_identifier",
        Some("The ID of the order placed on the originating platform."),
        isNullable = true
      ),
      "/source_identifier"
    ),
    ShopifyColumn(
      StringColumn(
        "source_url",
        "source_url",
        Some("A valid URL to the original order on the originating surface."),
        isNullable = true
      ),
      "/source_url"
    ),
    ShopifyColumn(
      DoubleColumn(
        "subtotal_price",
        "subtotal_price",
        Some(
          "The price of the order in the shop currency after discounts but before shipping, duties, taxes, and tips."
        ),
        isNullable = true
      ),
      "/subtotal_price"
    ),
    ShopifyColumn(
      StringColumn(
        "subtotal_price_set",
        "subtotal_price_set",
        Some(
          "The subtotal of the order in shop and presentment currencies after discounts but before shipping, duties, taxes, and tips."
        ),
        isNullable = true
      ),
      "/subtotal_price_set"
    ),
    ShopifyColumn(
      StringColumn(
        "tags",
        "tags",
        Some("Tags attached to the order, formatted as a string of comma-separated values."),
        isNullable = true
      ),
      "/tags"
    ),
    ShopifyColumn(
      StringColumn(
        "tax_lines",
        "tax_lines",
        Some("An array of tax line objects, each of which details a tax applicable to the order."),
        isNullable = true
      ),
      "/tax_lines"
    ),
    ShopifyColumn(
      BoolColumn(
        "taxes_included",
        "taxes_included",
        Some("Whether taxes are included in the order subtotal."),
        isNullable = true
      ),
      "/taxes_included"
    ),
    ShopifyColumn(
      BoolColumn("test", "test", Some("Whether this is a test order."), isNullable = true),
      "/test"
    ),
    ShopifyColumn(
      StringColumn("token", "token", Some("A unique value when referencing the order."), isNullable = true),
      "/token"
    ),
    ShopifyColumn(
      DoubleColumn(
        "total_discounts",
        "total_discounts",
        Some("The total discounts applied to the price of the order in the shop currency."),
        isNullable = true
      ),
      "/total_discounts"
    ),
    ShopifyColumn(
      StringColumn(
        "total_discounts_set",
        "total_discounts_set",
        Some("The total discounts applied to the price of the order in shop and presentment currencies."),
        isNullable = true
      ),
      "/total_discounts_set"
    ),
    ShopifyColumn(
      DoubleColumn(
        "total_line_items_price",
        "total_line_items_price",
        Some("The sum of all line item prices in the shop currency."),
        isNullable = true
      ),
      "/total_line_items_price"
    ),
    ShopifyColumn(
      StringColumn(
        "total_line_items_price_set",
        "total_line_items_price_set",
        Some("The total of all line item prices in shop and presentment currencies."),
        isNullable = true
      ),
      "/total_line_items_price_set"
    ),
    ShopifyColumn(
      DoubleColumn(
        "total_outstanding",
        "total_outstanding",
        Some("The total outstanding amount of the order in the shop currency."),
        isNullable = true
      ),
      "/total_outstanding"
    ),
    ShopifyColumn(
      DoubleColumn(
        "total_price",
        "total_price",
        Some(
          "The sum of all line item prices, discounts, shipping, taxes, and tips in the shop currency. Must be positive."
        ),
        isNullable = true
      ),
      "/total_price"
    ),
    ShopifyColumn(
      StringColumn(
        "total_price_set",
        "total_price_set",
        Some("The total price of the order in shop and presentment currencies."),
        isNullable = true
      ),
      "/total_price_set"
    ),
    ShopifyColumn(
      StringColumn(
        "total_shipping_price_set",
        "total_shipping_price_set",
        Some(
          "The total shipping price of the order, excluding discounts and returns, in shop and presentment currencies."
        ),
        isNullable = true
      ),
      "/total_shipping_price_set"
    ),
    ShopifyColumn(
      DoubleColumn(
        "total_tax",
        "total_tax",
        Some("The sum of all the taxes applied to the order in the shop currency. Must be positive."),
        isNullable = true
      ),
      "/total_tax"
    ),
    ShopifyColumn(
      DoubleColumn(
        "total_tip_received",
        "total_tip_received",
        Some("The sum of all the tips in the order in the shop currency."),
        isNullable = true
      ),
      "/total_tip_received"
    ),
    ShopifyColumn(
      DoubleColumn(
        "total_weight",
        "total_weight",
        Some("The sum of all line item weights in grams."),
        isNullable = true
      ),
      "/total_weight"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "updated_at",
        "updated_at",
        Some("The date and time (ISO 8601 format) when the order was last modified."),
        isNullable = true
      ),
      "/updated_at"
    ),
    ShopifyColumn(
      Int64Column(
        "user_id",
        "user_id",
        Some("The ID of the user logged into Shopify POS who processed the order, if applicable."),
        isNullable = true
      ),
      "/user_id"
    ),
    ShopifyColumn(
      StringColumn(
        "order_status_url",
        "order_status_url",
        Some("The URL pointing to the order status web page, if applicable."),
        isNullable = true
      ),
      "/order_status_url"
    )
  )
}
