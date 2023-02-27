package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{DateTimeColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/collection#top
class CollectionReader(
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
      columns = CollectionReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(reportData: (Seq[Record], String) => Unit) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchCollects(lastSyncedValue)((collects: Seq[JsonNode]) => {
      collects
        .filter(_.at("/id").isExists())
        .filter(_.at("/collection_id").isExists())
        .foreach(collect => {
          try {
            val collectionId: String = collect.at("/collection_id").asText()
            val collection: JsonNode = client.getCollection(collectionId)
            val record: Record = CollectionReader.serialize(collection)
            currentLatestId = ShopifyReader.max(collect.at("/id").asText(), currentLatestId)
            reportData(Seq(record), currentLatestId)
          } catch {
            case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
              warn(s"get collection of collect_id: ${collect.at("/id").asText()} not found")
          }
        })

    })
  }

  @throws[ShopifyClientException]
  private def fetchCollects(lastId: Option[String])(handler: (Seq[JsonNode]) => Unit): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val collects: ShopifyPage[JsonNode] = client.getCollects(request)
      handler(collects.asScala)

      if (collects.isEmpty || collects.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(collects.getNextPageInfo)
      }
    }
  }
}

object CollectionReader {
  def serialize(node: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("The ID for the collection."),
          isNullable = false
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "body_html",
          "body_html",
          Some(
            "A description of the collection, complete with HTML markup. Many templates display this on their collection pages."
          ),
          isNullable = true
        ),
        "/body_html"
      ),
      ShopifyColumn(
        StringColumn(
          "handle",
          "handle",
          Some(
            "A unique, human-readable string for the collection automatically generated from its title. This is used in themes by the Liquid templating language to refer to the collection. (limit: 255 characters)"
          ),
          isNullable = true
        ),
        "/handle"
      ),
      ShopifyColumn(
        StringColumn(
          "image",
          "image",
          Some("Image associated with the collection."),
          isNullable = true
        ),
        "/image"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "published_at",
          "published_at",
          Some(
            "The time and date (ISO 8601 format) when the collection was made visible. Returns null for a hidden collection."
          ),
          isNullable = true
        ),
        "/published_at"
      ),
      ShopifyColumn(
        StringColumn(
          "published_scope",
          "published_scope",
          Some("Whether the collection is published to the Point of Sale channel."),
          isNullable = true
        ),
        "/published_scope"
      ),
      ShopifyColumn(
        StringColumn(
          "sort_order",
          "sort_order",
          Some("The order in which products in the collection appear."),
          isNullable = true
        ),
        "/sort_order"
      ),
      ShopifyColumn(
        StringColumn(
          "template_suffix",
          "template_suffix",
          Some(
            "The suffix of the liquid template being used. For example, if the value is custom, then the collection is using the collection.custom.liquid template. If the value is null, then the collection is using the default collection.liquid."
          ),
          isNullable = true
        ),
        "/template_suffix"
      ),
      ShopifyColumn(
        StringColumn(
          "title",
          "title",
          Some("The name of the collection. (limit: 255 characters)"),
          isNullable = true
        ),
        "/title"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the collection was last modified."),
          isNullable = true
        ),
        "/updated_at"
      )
    )
}
