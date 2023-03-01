package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{DateTimeColumn, DoubleColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

class GiftCardReader(
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
      columns = GiftCardReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchGiftCards(lastSyncedValue)((giftCards: Seq[JsonNode]) => {
      if (giftCards.nonEmpty) {
        val records: Seq[Record] = giftCards.map(GiftCardReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(giftCards.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchGiftCards(lastSyncedId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastSyncedId.orNull).withLimit(limitSize).build()
    while (true) {
      val giftCards: ShopifyPage[JsonNode] = client.getGiftCards(request)
      handler(giftCards.asScala)

      if (giftCards.isEmpty || giftCards.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(giftCards.getNextPageInfo)
      }

    }
  }

}

object GiftCardReader {
  def serialize(node: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("The ID of the gift card."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        Int64Column(
          name = "api_client_id",
          displayName = "api_client_id",
          description = Option("The ID of the client that issued the gift card."),
          isNullable = true
        ),
        path = "/api_client_id"
      ),
      ShopifyColumn(
        DoubleColumn(
          name = "balance",
          displayName = "balance",
          Option("The balance of the gift card.."),
          isNullable = true
        ),
        path = "/balance"
      ),
      ShopifyColumn(
        StringColumn(
          name = "code",
          displayName = "code",
          Option(
            "The gift card code, which is a string of alphanumeric characters. For security reasons, this is available only upon creation of the gift card. (minimum: 8 characters, maximum: 20 characters)"
          ),
          isNullable = true
        ),
        path = "/code"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "created_at",
          displayName = "created_at",
          Option("The date and time (ISO 8601 format) when the gift card was created."),
          isNullable = true
        ),
        path = "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "currency",
          displayName = "currency",
          Option("The currency of the gift card."),
          isNullable = true
        ),
        path = "/currency"
      ),
      ShopifyColumn(
        StringColumn(
          name = "customer_id",
          displayName = "customer_id",
          Option("The ID of the customer associated with this gift card."),
          isNullable = true
        ),
        path = "/customer_id"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "disabled_at",
          displayName = "disabled_at",
          Option("The date and time (ISO 8601 format) when the gift card was disabled."),
          isNullable = true
        ),
        path = "/disabled_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "expires_on",
          displayName = "expires_on",
          Option(
            "The date (YYYY-MM-DD format) when the gift card expires. Returns null if the gift card doesn't have an expiration date."
          ),
          isNullable = true
        ),
        path = "/expires_on"
      ),
      ShopifyColumn(
        DoubleColumn(
          name = "initial_value",
          displayName = "initial_value",
          Option("The initial value of the gift card when it was created."),
          isNullable = true
        ),
        path = "/initial_value"
      ),
      ShopifyColumn(
        StringColumn(
          name = "last_characters",
          displayName = "last_characters",
          Option(
            "The last four characters of the gift card code. Because gift cards are alternative payment methods, the full code cannot be retrieved."
          ),
          isNullable = true
        ),
        path = "/last_characters"
      ),
      ShopifyColumn(
        Int64Column(
          name = "line_item_id",
          displayName = "line_item_id",
          Option(
            "The ID of the line item that initiated the creation of this gift card, if it was created by an order."
          ),
          isNullable = true
        ),
        path = "/line_item_id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "note",
          displayName = "note",
          Option("An optional note that a merchant can attach to the gift card that isn't visible to customers."),
          isNullable = true
        ),
        path = "/note"
      ),
      ShopifyColumn(
        Int64Column(
          name = "order_id",
          displayName = "order_id",
          Option("The ID of the order that initiated the creation of this gift card, if it was created by an order."),
          isNullable = true
        ),
        path = "/order_id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "template_suffix",
          displayName = "template_suffix",
          Option(
            "The suffix of the Liquid template that's used to render the gift card online. For example, if the value is birthday, then the gift card is rendered using the template gift_card.birthday.liquid. When the value is null, the default gift_card.liquid template is used."
          ),
          isNullable = true
        ),
        path = "/template_suffix"
      ),
      ShopifyColumn(
        Int64Column(
          name = "user_id",
          displayName = "user_id",
          Option("The ID of the user that issued the gift card, if it was issued by a user."),
          isNullable = true
        ),
        path = "/user_id"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "updated_at",
          displayName = "updated_at",
          Option("The date and time (ISO 8601 format) when the gift card was last modified."),
          isNullable = true
        ),
        path = "/updated_at"
      )
    )
}
