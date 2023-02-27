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

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/transaction#top
class TenderTransactionReader(
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
      columns = TenderTransactionReader.LIST_COLUMNS.map(_.column)
    );
  }
  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchTenderTransactions(lastSyncedValue)((transactions: Seq[JsonNode]) => {
      if (transactions.nonEmpty) {
        val records: Seq[Record] = transactions.map(TenderTransactionReader.serialize)
        val transactionIds: Seq[String] = transactions.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(transactionIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchTenderTransactions(lastId: Option[String])(
      handler: ((Seq[JsonNode]) => Unit)
  ): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val tenderTransactions: ShopifyPage[JsonNode] = client.getTenderTransactions(request)
      handler(tenderTransactions.asScala)

      // end of page
      if (tenderTransactions.isEmpty || tenderTransactions.getNextPageInfo == null) {
        return;
      } else {
        // fetch next page, must reset
        request.setSinceId(null)
        request.setPageInfo(tenderTransactions.getNextPageInfo)
      }

    }
  }
}

object TenderTransactionReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("The ID of the transaction."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        Int64Column(
          name = "order_id",
          displayName = "order_id",
          description = Option("The ID of the order that the tender transaction belongs to."),
          isNullable = true
        ),
        path = "/order_id"
      ),
      ShopifyColumn(
        DoubleColumn(
          name = "amount",
          displayName = "amount",
          description = Option("The amount of the tender transaction in the shop's currency."),
          isNullable = true
        ),
        path = "/amount"
      ),
      ShopifyColumn(
        StringColumn(
          name = "currency",
          displayName = "currency",
          description =
            Option("The three-letter code (ISO 4217 format) for the currency used for the tender transaction."),
          isNullable = true
        ),
        path = "/currency"
      ),
      ShopifyColumn(
        Int64Column(
          name = "user_id",
          displayName = "user_id",
          description = Option(
            "The ID of the user logged into the Shopify POS device that processed the tender transaction, if applicable."
          ),
          isNullable = true
        ),
        path = "/user_id"
      ),
      ShopifyColumn(
        BoolColumn(
          name = "test",
          displayName = "test",
          description = Option("Whether the tender transaction is a test transaction."),
          isNullable = true
        ),
        path = "/test"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "processed_at",
          displayName = "processed_at",
          description = Option("The date and time (ISO 8601 format) when the tender transaction was processed."),
          isNullable = true
        ),
        path = "/processed_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "remote_reference",
          displayName = "remote_reference",
          description = Option("The remote (gateway) reference associated with the tender."),
          isNullable = true
        ),
        path = "/remote_reference"
      ),
      ShopifyColumn(
        StringColumn(
          name = "payment_details",
          displayName = "payment_details",
          description = Option("Information about the payment instrument used for this transaction."),
          isNullable = true
        ),
        path = "/payment_details"
      ),
      ShopifyColumn(
        StringColumn(
          name = "payment_method",
          displayName = "payment_method",
          description = Option("Information about the payment method used for this transaction."),
          isNullable = true
        ),
        path = "/payment_method"
      )
    )
}
