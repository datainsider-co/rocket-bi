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

class DraftOrderReader(
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
      columns = DraftOrderReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchDaftOrders(lastSyncedValue)((daftOrders: Seq[JsonNode]) => {
      if (daftOrders.nonEmpty) {
        val records: Seq[Record] = daftOrders.map(DraftOrderReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(daftOrders.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })

  }


  @throws[ShopifyClientException]
  private def fetchDaftOrders(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val draftOrders: ShopifyPage[JsonNode] = client.getDraftOrders(request)
      handler(draftOrders.asScala)

      if (draftOrders.isEmpty || draftOrders.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(draftOrders.getNextPageInfo)
      }
    }
  }
}

object DraftOrderReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("The ID of the draft order."), isNullable = true),
        "/id"
      ),
      ShopifyColumn(
        Int64Column(
          "order_id",
          "order_id",
          Some(
            "The ID of the order that 's created and associated with the draft order after the draft order is completed."
          ),
          isNullable = true
        ),
        "/order_id"
      ),
      ShopifyColumn(
        StringColumn("name", "name", Some("Name of the draft order."), isNullable = true),
        "/name"
      ),
      ShopifyColumn(
        StringColumn("customer", "customer", Some("Information about the customer."), isNullable = true),
        "/customer"
      ),
      ShopifyColumn(
        StringColumn("customer_id", "customer_id", Some("Id of customer."), isNullable = true),
        "/customer_id/id"
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
          "billing_address",
          "billing_address",
          Some(
            "The mailing address associated with the payment method."
          ),
          isNullable = true
        ),
        "/billing_address"
      ),
      ShopifyColumn(
        StringColumn(
          "note",
          "note",
          Some("The text of an optional note that a shop owner can attach to the draft order."),
          isNullable = true
        ),
        "/note"
      ),
      ShopifyColumn(
        StringColumn(
          "note_attributes",
          "note_attributes",
          Some(
            "Extra information that is added to the order. Appears in the Additional details section of an order details page"
          ),
          isNullable = true
        ),
        "/note_attributes"
      ),
      ShopifyColumn(
        StringColumn("email", "email", Some("The customer's email address."), isNullable = true),
        "/email"
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
        DateTimeColumn(
          "invoice_sent_at",
          "invoice_sent_at",
          Some("The date and time (ISO 8601 format) when the invoice was emailed to the customer."),
          isNullable = true
        ),
        "/invoice_sent_at"
      ),
      ShopifyColumn(
        StringColumn(
          "invoice_url",
          "invoice_url",
          Some("The URL for the invoice."),
          isNullable = true
        ),
        "/invoice_url"
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
          "payment_terms",
          "payment_terms",
          Some("The terms and conditions under which a payment should be processed."),
          isNullable = true
        ),
        "/payment_terms"
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
          "tags",
          "tags",
          Some("Tags attached to the order, formatted as a string of comma-separated values."),
          isNullable = true
        ),
        "/tags"
      ),
      ShopifyColumn(
        BoolColumn(
          "tax_exempt",
          "tax_exempt",
          Some("Whether taxes are exempt for the draft order."),
          isNullable = true
        ),
        "/tax_exempt"
      ),
      ShopifyColumn(
        StringColumn(
          "tax_exemptions",
          "tax_exemptions",
          Some("Whether the customer is exempt from paying specific taxes on their order. Canadian taxes only."),
          isNullable = true
        ),
        "/tax_exemptions"
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
        StringColumn(
          "applied_discount",
          "applied_discount",
          Some("The discount applied to the line item or the draft order object."),
          isNullable = true
        ),
        "/applied_discount"
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
        DateTimeColumn(
          "completed_at",
          "completed_at",
          Some("The date and time (ISO 8601 format) when the order is created and the draft order is completed."),
          isNullable = true
        ),
        "/completed_at"
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
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the order was last modified."),
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          "status",
          "status",
          Some("The status of a draft order as it transitions into an order. "),
          isNullable = true
        ),
        "/status"
      )
    )

}
