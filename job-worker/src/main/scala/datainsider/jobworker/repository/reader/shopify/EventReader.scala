package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{DateTimeColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

class EventReader(
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
      columns = EventReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchEvents(lastSyncedValue)((events: Seq[JsonNode]) => {
      if (events.nonEmpty) {
        val records: Seq[Record] = events.map(EventReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(events.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }


  @throws[ShopifyClientException]
  private def fetchEvents(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val events: ShopifyPage[JsonNode] = client.getEvents(request)
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

object EventReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }
  private val LIST_COLUMNS: Array[ShopifyColumn] = Array[ShopifyColumn](
    ShopifyColumn(
      Int64Column(
        "id",
        "id",
        Some("The ID of the event."),
        isNullable = false
      ),
      "/id",
    ),
    new ShopifyColumn(
      Int64Column(
        "subject_id",
        "subject_id",
        Some("The ID of the resource that generated the event."),
        isNullable = false
      ),
      "/subject_id",
    ),
    new ShopifyColumn(
      StringColumn(
        "arguments",
        "arguments",
        Some("Refers to a certain event and its resources."),
        isNullable = false
      ),
      "/arguments",
    ),
    new ShopifyColumn(
      StringColumn(
        "body",
        "body",
        Some("body"),
        isNullable = false
      ),
      "/body",
    ),
    new ShopifyColumn(
      DateTimeColumn(
        "created_at",
        "created_at",
        Some("The date and time (ISO 8601 format) when the event was created."),
        isNullable = true
      ),
      "/created_at",
    ),
    new ShopifyColumn(
      StringColumn(
        "description",
        "description",
        Some("A human readable description of the event."),
        isNullable = true
      ),
      "/description",
    ),
    new ShopifyColumn(
      StringColumn(
        "path",
        "path",
        Some("A relative URL to the resource the event is for, if applicable."),
        isNullable = true
      ),
      "/path",
    ),
    new ShopifyColumn(
      StringColumn(
        "message",
        "message",
        Some("A human readable description of the event. Can contain some HTML formatting."),
        isNullable = true
      ),
      "/message",
    ),
    new ShopifyColumn(
      StringColumn(
        "subject_type",
        "subject_type",
        Some("The type of the resource that generated the event."),
        isNullable = true
      ),
      "/subject_type",
    ),
    new ShopifyColumn(
      StringColumn(
        "verb",
        "verb",
        Some("The type of event that occurred. Different resources generate different types of event. See the Resources section for a list of possible verbs."),
        isNullable = true
      ),
      "/verb",
    ),
  )
}
