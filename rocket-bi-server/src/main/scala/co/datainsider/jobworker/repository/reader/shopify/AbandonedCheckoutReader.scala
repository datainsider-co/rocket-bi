package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.bi.client.JdbcClient.Record

import scala.jdk.CollectionConverters.asScalaBufferConverter

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/abandoned-checkouts#top
class AbandonedCheckoutReader(
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
      columns = AbandonedCheckoutReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(reportData: (Seq[Record], String) => Unit): Unit = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchAbandonedCheckouts(lastSyncedValue)((checkouts: Seq[JsonNode]) => {
      if (checkouts.nonEmpty) {
        val records: Seq[Record] = checkouts.map(AbandonedCheckoutReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(checkouts.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchAbandonedCheckouts(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val abandonedCheckouts: ShopifyPage[JsonNode] = client.getAbandonedCheckouts(request)
      handler(abandonedCheckouts.asScala)

      if (abandonedCheckouts.isEmpty || abandonedCheckouts.getNextPageInfo == null) {
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(abandonedCheckouts.getNextPageInfo)
      }
    }
  }
}

object AbandonedCheckoutReader {

  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("The ID for the checkout."), isNullable = true),
        path = "/id"
      ),
      ShopifyColumn(
        Int64Column("user_id", "user_id", Some("The ID of the user who created the checkout."), isNullable = true),
        "/user_id"
      ),
      ShopifyColumn(
        StringColumn(
          "abandoned_checkout_url",
          "abandoned_checkout_url",
          Some("The recovery URL that's sent to a customer so they can recover their checkout."),
          isNullable = true
        ),
        path = "/abandoned_checkout_url"
      ),
      ShopifyColumn(
        StringColumn(
          "billing_address",
          "billing_address",
          Some("IThe mailing address associated with the payment method."),
          isNullable = true
        ),
        "/billing_address"
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
        BoolColumn(
          "buyer_accepts_sms_marketing",
          "buyer_accepts_sms_marketing",
          Some("Whether the customer would like to receive SMS updates from the shop."),
          isNullable = true
        ),
        "/buyer_accepts_sms_marketing"
      ),
      ShopifyColumn(
        StringColumn(
          "cart_token",
          "cart_token",
          Some("The ID for the cart that's attached to the checkout."),
          isNullable = true
        ),
        "/cart_token"
      ),
      ShopifyColumn(
        StringColumn(
          "customer",
          "customer",
          Some(
            "The customer details associated with the abandoned checkout. For more information, refer to the Customer resource."
          ),
          isNullable = true
        ),
        "/customer"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "closed_at",
          "closed_at",
          Some(
            "The date and time (ISO 8601 format) when the checkout was closed. If the checkout was not closed, then this value is null."
          ),
          isNullable = true
        ),
        "/closed_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "completed_at",
          "completed_at",
          Some(
            "The date and time (ISO 8601 format) when the checkout was completed. For abandoned checkouts, this value is null until a customer completes the checkout using the recovery URL."
          ),
          isNullable = true
        ),
        "/completed_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the checkout was created."),
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
        StringColumn(
          "customer_locale",
          "customer_locale",
          Some(
            "The two or three-letter language code, optionally followed by a region modifier. Example values: en, en-CA."
          ),
          isNullable = true
        ),
        "/customer_locale"
      ),
      ShopifyColumn(
        StringColumn(
          "device_id",
          "device_id",
          Some("The ID of the Shopify POS device that created the checkout."),
          isNullable = true
        ),
        "/device_id"
      ),
      ShopifyColumn(
        StringColumn(
          "discount_codes",
          "discount_codes",
          Some("Discount codes applied to the checkout. Returns an empty array when no codes are applied.\n"),
          isNullable = true
        ),
        "/discount_codes"
      ),
      ShopifyColumn(
        StringColumn("email", "email", Some("The customer's email address."), isNullable = true),
        "/email"
      ),
      ShopifyColumn(
        StringColumn(
          "gateway",
          "gateway",
          Some("The payment gateway used by the checkout. For abandoned checkouts, this value is always null."),
          isNullable = true
        ),
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
          Some("A list of line items, each containing information about an item in the checkout."),
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
        "/location_id",
      ),
      ShopifyColumn(
        StringColumn(
          "note",
          "note",
          Some("The text of an optional note that a shop owner can attach to the order."),
          isNullable = true
        ),
        "/note",
      ),
      ShopifyColumn(
        StringColumn(
          "phone",
          "phone",
          Some("The customer's phone number for receiving SMS notifications."),
          isNullable = true
        ),
        "/phone",
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
        StringColumn(
          "referring_site",
          "referring_site",
          Some("The website where the customer clicked a link to the shop."),
          isNullable = true
        ),
        "/referring_site",
      ),
      ShopifyColumn(
        StringColumn(
          "shipping_address",
          "shipping_address",
          Some("The mailing address to where the order will be shipped."),
          isNullable = true
        ),
        "/shipping_address",
      ),
      ShopifyColumn(
        StringColumn(
          "sms_marketing_phone",
          "sms_marketing_phone",
          Some("The phone number used to opt in to SMS marketing during checkout."),
          isNullable = true
        ),
        "/sms_marketing_phone",
      ),
      ShopifyColumn(
        StringColumn(
          "shipping_lines",
          "shipping_lines",
          Some("Information about the chosen shipping method"),
          isNullable = true
        ),
        "/shipping_lines"
      ),
      ShopifyColumn(
        StringColumn("source_name", "source_name", Some("The source of the checkout."), isNullable = true),
        "/source_name"
      ),
      ShopifyColumn(
        BoolColumn(
          "taxes_included",
          "taxes_included",
          Some("Whether taxes are included in the price."),
          isNullable = true
        ),
        "/taxes_included"
      ),
      ShopifyColumn(
        StringColumn(
          "token",
          "token",
          Some("A unique ID for a checkout."),
          isNullable = true
        ),
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
        DoubleColumn(
          "total_duties",
          "total_duties",
          Some("The total duties of the checkout in presentment currency."),
          isNullable = true
        ),
        "/total_duties"
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
        DoubleColumn(
          "total_price",
          "total_price",
          Some(
            "The sum of line item prices, all discounts, shipping costs, and taxes for the checkout in presentment currency."
          ),
          isNullable = true
        ),
        "/total_price"
      ),
      ShopifyColumn(
        DoubleColumn(
          "total_tax",
          "total_tax",
          Some(
            "The sum of all the taxes applied to the order."
          ),
          isNullable = true
        ),
        "/total_tax"
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
      )
    )

}
