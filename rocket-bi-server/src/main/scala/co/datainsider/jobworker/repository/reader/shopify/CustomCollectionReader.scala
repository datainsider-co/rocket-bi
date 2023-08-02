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

import scala.jdk.CollectionConverters.asScalaBufferConverter

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/customcollection#top
class CustomCollectionReader(
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
      columns = CustomCollectionReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchCustomCollections(lastSyncedValue)((collections: Seq[JsonNode]) => {
      if (collections.nonEmpty) {
        val records: Seq[Record] = collections.map(CustomCollectionReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(collections.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchCustomCollections(lastId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val collections: ShopifyPage[JsonNode] = client.getCustomCollections(request)
      handler(collections.asScala)

      if (collections.isEmpty || collections.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(collections.getNextPageInfo)
      }
    }
  }
}

object CustomCollectionReader {
  def serialize(jsonNode: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, jsonNode))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("The ID for the custom collection."),
          isNullable = false
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "body_html",
          "body_html",
          Some(
            "The description of the custom collection, complete with HTML markup. Many templates display this on their custom collection pages."
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
            "A human-friendly unique string for the custom collection automatically generated from its title. This is used in shop themes by the Liquid templating language to refer to the custom collection. (limit: 255 characters)"
          ),
          isNullable = true
        ),
        "/handle"
      ),
      ShopifyColumn(
        StringColumn(
          "image",
          "image",
          Some("Image associated with the custom collection."),
          isNullable = true
        ),
        "/image"
      ),
      ShopifyColumn(
        BoolColumn(
          "published",
          "published",
          Some(
            "Whether the custom collection is published to the Online Store channel."
          ),
          isNullable = true
        ),
        "/published"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "published_at",
          "published_at",
          Some(
            "The time and date (ISO 8601 format) when the collection was made visible. Returns null for a hidden custom collection.\n"
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
          Some("The order in which products in the custom collection appear."),
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
          Some("The name of the custom collection. Maximum length: 255 characters."),
          isNullable = true
        ),
        "/title"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the custom collection was last modified."),
          isNullable = true
        ),
        "/updated_at"
      )
    )
}
