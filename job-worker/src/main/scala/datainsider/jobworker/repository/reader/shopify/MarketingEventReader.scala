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

class MarketingEventReader(
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
      columns = MarketingEventReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchMarketingEvents(lastSyncedValue)((marketingEvents: Seq[JsonNode]) => {
      if (marketingEvents.nonEmpty) {
        val records: Seq[Record] = marketingEvents.map(MarketingEventReader.serialize)
        val eventIds: Seq[String] = marketingEvents.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(eventIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchMarketingEvents(lastId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val events: ShopifyPage[JsonNode] = client.getMarketingEvents(request)
      handler(events.asScala)

      if (events.isEmpty || events.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(events.getNextPageInfo)
      }

    }
  }
}

object MarketingEventReader {
  def serialize(node: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Option("The ID for the event."),
          isNullable = true
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "remote_id",
          "remote_id",
          Option(
            "An optional remote identifier for a marketing event. The remote identifier lets Shopify validate engagement data."
          ),
          isNullable = true
        ),
        "/remote_id"
      ),
      ShopifyColumn(
        StringColumn(
          "event_type",
          "event_type",
          Option(
            "The type of marketing event. Valid values: ad, post, message, retargeting, transactional, affiliate, loyalty, newsletter, abandoned_cart.a."
          ),
          isNullable = true
        ),
        "/event_type"
      ),
      ShopifyColumn(
        StringColumn(
          "marketing_channel",
          "marketing_channel",
          Option(
            "The channel that your marketing event will use. Valid values: search, display, social, email, referral."
          ),
          isNullable = true
        ),
        "/marketing_channel"
      ),
      ShopifyColumn(
        BoolColumn(
          "paid",
          "paid",
          Option("Whether the event is paid or organic."),
          isNullable = true
        ),
        "/paid"
      ),
      ShopifyColumn(
        StringColumn(
          "referring_domain",
          "referring_domain",
          Option(
            "The destination domain of the marketing event. Required if the marketing_channel is set to search or social."
          ),
          isNullable = true
        ),
        "/referring_domain"
      ),
      ShopifyColumn(
        DoubleColumn(
          "budget",
          "budget",
          Option("The budget of the ad campaign."),
          isNullable = true
        ),
        "/budget"
      ),
      ShopifyColumn(
        StringColumn(
          "currency",
          "currency",
          Option("The currency for the budget. Required if budget is specified."),
          isNullable = true
        ),
        "/currency"
      ),
      ShopifyColumn(
        StringColumn(
          "budget_type",
          "budget_type",
          Option("The type of the budget. Required if budget is specified. Valid values: daily, lifetime.'"),
          isNullable = true
        ),
        "/budget_type"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "started_at",
          "started_at",
          Option("The time when the marketing action was started."),
          isNullable = true
        ),
        "/started_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "scheduled_to_end_at",
          "scheduled_to_end_at",
          Option(("For events with a duration, the time when the event was scheduled to end.")),
          isNullable = true
        ),
        "/scheduled_to_end_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "ended_at",
          "ended_at",
          Some("For events with a duration, the time when the event actually ended."),
          isNullable = true
        ),
        "/ended_at"
      ),
      ShopifyColumn(
        StringColumn(
          "description",
          "description",
          Option(("A description of the marketing event.")),
          isNullable = true
        ),
        "/description"
      ),
      ShopifyColumn(
        StringColumn(
          "manage_url",
          "manage_url",
          Some("A link to manage the marketing event. In most cases, this links to the app that created the event."),
          isNullable = true
        ),
        "/manage_url"
      ),
      ShopifyColumn(
        StringColumn(
          "preview_url",
          "preview_url",
          Some("A link to the live version of the event, or to a rendered preview in the app that created it."),
          isNullable = true
        ),
        "/preview_url"
      ),
      ShopifyColumn(
        StringColumn(
          "marketed_resources",
          "marketed_resources",
          Some("A list of the items that were marketed in the marketing event. Includes the type and id of each item."),
          isNullable = true
        ),
        "/marketed_resources"
      ),
      ShopifyColumn(
        StringColumn(
          "utm_campaign",
          "utm_campaign",
          None,
          isNullable = true
        ),
        "/utm_campaign"
      ),
      ShopifyColumn(
        StringColumn(
          "utm_source",
          "utm_source",
          None,
          isNullable = true
        ),
        "/utm_source"
      ),
      ShopifyColumn(
        StringColumn(
          "utm_medium",
          "utm_medium",
          None,
          isNullable = true
        ),
        "/utm_medium"
      ),
      ShopifyColumn(
        StringColumn(
          "marketing_activity_id",
          "marketing_activity_id",
          None,
          isNullable = true
        ),
        "/marketing_activity_id"
      ),
      ShopifyColumn(
        StringColumn(
          "breadcrumb_id",
          "breadcrumb_id",
          None,
          isNullable = true
        ),
        "/breadcrumb_id"
      )
    )
}
