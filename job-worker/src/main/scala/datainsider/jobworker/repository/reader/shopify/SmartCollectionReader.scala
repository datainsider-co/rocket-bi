package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{BoolColumn, DateTimeColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/smartcollection#top
class SmartCollectionReader(
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
      columns = SmartCollectionReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchSmartCollections(lastSyncedValue)((collections: Seq[JsonNode]) => {
      if (collections.nonEmpty) {
        val records: Seq[Record] = collections.map(SmartCollectionReader.serialize)
        val collectionIds: Seq[String] = collections.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(collectionIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, latestId)
      }
    })
  }


  @throws[ShopifyClientException]
  private def fetchSmartCollections(lastId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val collections: ShopifyPage[JsonNode] = client.getSmartCollections(request)
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

object SmartCollectionReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("The ID of the smart collection."),
          isNullable = false
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "body_html",
          "body_html",
          Some(
            "The description of the smart collection. Includes HTML markup. Many shop themes display this on the smart collection page."
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
            "A human-friendly unique string for the smart collection. Automatically generated from the title. Used in shop themes by the Liquid templating language to refer to the smart collection. (maximum: 255 characters)"
          ),
          isNullable = true
        ),
        "/handle"
      ),
      ShopifyColumn(
        StringColumn(
          "image",
          "image",
          Some("Image associated with the smart collection."),
          isNullable = true
        ),
        "/image"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "published_at",
          "published_at",
          Some(
            "The date and time (ISO 8601 format) that the smart collection was published. Returns null when the collection is hidden."
          ),
          isNullable = true
        ),
        "/published_at"
      ),
      ShopifyColumn(
        StringColumn(
          "published_scope",
          "published_scope",
          Some("Whether the smart collection is published to the Point of Sale channel."),
          isNullable = true
        ),
        "/published_scope"
      ),
      ShopifyColumn(
        StringColumn(
          "rules",
          "rules",
          Some(
            "The list of rules that define what products go into the smart collection."
          ),
          isNullable = true
        ),
        "/rules"
      ),
      ShopifyColumn(
        BoolColumn(
          "disjunctive",
          "disjunctive",
          Some(
            "Whether the product must match all the rules to be included in the smart collection."
          ),
          isNullable = true
        ),
        "/disjunctive"
      ),
      ShopifyColumn(
        StringColumn(
          "sort_order",
          "sort_order",
          Some("The order in which products in the smart collection appear."),
          isNullable = true
        ),
        "/sort_order"
      ),
      ShopifyColumn(
        StringColumn(
          "template_suffix",
          "template_suffix",
          Some(
            "The suffix of the Liquid template that the shop uses. By default, the original template is called product.liquid, and additional templates are called product.suffix.liquid."
          ),
          isNullable = true
        ),
        "/template_suffix"
      ),
      ShopifyColumn(
        StringColumn(
          "title",
          "title",
          Some("The name of the smart collection. Maximum length: 255 characters."),
          isNullable = true
        ),
        "/title"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the smart collection was last modified."),
          isNullable = true
        ),
        "/updated_at"
      )
    )
}
