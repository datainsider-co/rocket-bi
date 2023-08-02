package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.bi.client.JdbcClient.Record
import ShopifyReader.ImplicitJsonNode
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/transaction#top
class TransactionReader(
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
      columns = TransactionReader.LIST_COLUMNS.map(_.column)
    );
  }
  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchOrderTransactions(lastSyncedValue)((orderId: String, transactions: Seq[JsonNode]) => {
      val records: Seq[Record] = transactions.map(TransactionReader.serialize)
      currentLatestId = ShopifyReader.max(orderId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }


  @throws[ShopifyClientException]
  private def fetchOrderTransactions(lastId: Option[String])(
      handler: ((String, Seq[JsonNode]) => Unit)
  ): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withFields("id").withLimit(limitSize).build()
    while (true) {
      val orders: ShopifyPage[JsonNode] = client.getOrders(request)
      println(s"fetchOrderTransactions:: ${orders}")

      orders.asScala
        .filter(_.at("/id").isExists())
        .foreach(order => {
          val orderId: String = order.at("/id").asText()
          val transactions: Seq[JsonNode] = getOrderTransactions(orderId)
          handler(orderId, transactions)
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

  private def getOrderTransactions(orderId: String): Seq[JsonNode] = {
    try {
      client.getOrderTransactions(orderId).asScala
    } catch {
      case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
        warn(s"get order transactions of order id ${orderId} not found")
        Seq.empty
    }
  }
}

object TransactionReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("The ID for the transaction."), isNullable = true),
        "/id"
      ),
      ShopifyColumn(
        Int64Column(
          "order_id",
          "order_id",
          Some("The ID for the order that the transaction is associated with."),
          isNullable = true
        ),
        "/order_id"
      ),
      ShopifyColumn(
        DoubleColumn("amount", "amount", Some("The amount of money included in the transaction."), isNullable = true),
        "/amount"
      ),
      ShopifyColumn(
        StringColumn(
          "authorization",
          "authorization",
          Some("The authorization code associated with the transaction."),
          isNullable = true
        ),
        "/authorization"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "authorization_expires_at",
          "authorization_expires_at",
          Some(
            "The date and time (ISO 8601 format) when the Shopify Payments authorization expires."
          ),
          isNullable = true
        ),
        "/authorization_expires_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the transaction was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          "currency",
          "currency",
          Some("The three-letter code (ISO 4217 format) for the currency used for the payment."),
          isNullable = true
        ),
        "/currency"
      ),
      ShopifyColumn(
        StringColumn(
          "device_id",
          "device_id",
          Some("The ID for the device."),
          isNullable = true
        ),
        "/device_id"
      ),
      ShopifyColumn(
        StringColumn(
          "error_code",
          "error_code",
          Some("A standardized error code, independent of the payment provider."),
          isNullable = true
        ),
        "/error_code"
      ),
      ShopifyColumn(
        StringColumn(
          "extended_authorization_attributes",
          "extended_authorization_attributes",
          Some("Information about the browser that the customer used when they placed their order"),
          isNullable = true
        ),
        "/extended_authorization_attributes"
      ),
      ShopifyColumn(
        StringColumn(
          "gateway",
          "gateway",
          Some(
            "The name of the gateway the transaction was issued through. A list of gateways can be found on Shopify's payment gateways page."
          ),
          isNullable = true
        ),
        "/gateway"
      ),
      ShopifyColumn(
        StringColumn(
          "kind",
          "kind",
          Some("The transaction's type."),
          isNullable = true
        ),
        "/kind"
      ),
      ShopifyColumn(
        StringColumn(
          "location_id",
          "location_id",
          Some("The ID of the physical location where the transaction was processed."),
          isNullable = true
        ),
        "/location_id"
      ),
      ShopifyColumn(
        StringColumn(
          "message",
          "message",
          Some(
            "A string generated by the payment provider with additional information about why the transaction succeeded or failed."
          ),
          isNullable = true
        ),
        "/message"
      ),
      ShopifyColumn(
        StringColumn(
          "payment_details",
          "payment_details",
          Some("Information about the credit card used for this transaction."),
          isNullable = true
        ),
        "/payment_details"
      ),
      ShopifyColumn(
        StringColumn(
          "parent_id",
          "parent_id",
          Some("The ID of an associated transaction."),
          isNullable = true
        ),
        "/parent_id"
      ),
      ShopifyColumn(
        DoubleColumn(
          "payments_refund_attributes",
          "payments_refund_attributes",
          Some("The attributes associated with a Shopify Payments refund."),
          isNullable = true
        ),
        "/payments_refund_attributes"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "processed_at",
          "processed_at",
          Some("The date and time (ISO 8601 format) when a transaction was processed."),
          isNullable = true
        ),
        "/processed_at"
      ),
      ShopifyColumn(
        StringColumn(
          "receipt",
          "receipt",
          Some(
            "A transaction receipt attached to the transaction by the gateway."
          ),
          isNullable = true
        ),
        "/receipt"
      ),
      ShopifyColumn(
        StringColumn(
          "source_name",
          "source_name",
          Some(
            "The origin of the transaction. This is set by Shopify and can't be overridden. Example values: web, pos, iphone, and android."
          ),
          isNullable = true
        ),
        "/source_name"
      ),
      ShopifyColumn(
        StringColumn(
          "status",
          "status",
          Some("The status of the transaction. Valid values: pending, failure, success, and error."),
          isNullable = true
        ),
        "/status"
      ),
      ShopifyColumn(
        BoolColumn(
          "test",
          "test",
          Some("Whether the transaction is a test transaction."),
          isNullable = true
        ),
        "/test"
      ),
      ShopifyColumn(
        Int64Column(
          "user_id",
          "user_id",
          Some(
            "The ID for the user who was logged into the Shopify POS device when the order was processed, if applicable."
          ),
          isNullable = true
        ),
        "/user_id"
      ),
      ShopifyColumn(
        StringColumn(
          "currency_exchange_adjustment",
          "currency_exchange_adjustment",
          Some(
            "An adjustment on the transaction showing the amount lost or gained due to fluctuations in the currency exchange rate."
          ),
          isNullable = true
        ),
        "/currency_exchange_adjustment"
      )
    )
}
