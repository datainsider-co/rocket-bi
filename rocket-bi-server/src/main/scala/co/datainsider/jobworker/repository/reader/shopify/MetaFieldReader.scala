package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, Int64Column, StringColumn}
import co.datainsider.bi.client.JdbcClient.Record

import scala.jdk.CollectionConverters.asScalaBufferConverter

class MetaFieldReader(
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
      columns = MetaFieldReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchMetaFields(lastSyncedValue)((metaFields: Seq[JsonNode]) => {
      if (metaFields.nonEmpty) {
        val records: Seq[Record] = metaFields.map(MetaFieldReader.serialize)
        val metaFieldIds: Seq[String] = metaFields.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(metaFieldIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchMetaFields(lastId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val metaFields: ShopifyPage[JsonNode] = client.getMetaFields(request)
      handler(metaFields.asScala)

      if (metaFields.isEmpty || metaFields.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(metaFields.getNextPageInfo)
      }

    }
  }
}

object MetaFieldReader {
  def serialize(node: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Option("The unique ID of the metafield."),
          isNullable = true
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "namespace",
          "namespace",
          Option(
            "A container for a group of metafields. Grouping metafields within a namespace prevents your metafields from conflicting with other metafields with the same key name. Must have between 3-20 characters."
          ),
          isNullable = true
        ),
        "/namespace"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Option("The date and time (ISO 8601 format) when the metafield was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          "description",
          "description",
          Option(("A description of the information that the metafield contains.")),
          isNullable = true
        ),
        "/description"
      ),
      ShopifyColumn(
        StringColumn(
          "key",
          "key",
          Option(
            "The key of the metafield. Keys can be up to 30 characters long and can contain alphanumeric characters, hyphens, underscores, and periods."
          ),
          isNullable = true
        ),
        "/key"
      ),
      ShopifyColumn(
        StringColumn(
          "owner_id",
          "owner_id",
          Option("The unique ID of the resource that the metafield is attached to."),
          isNullable = true
        ),
        "/owner_id"
      ),
      ShopifyColumn(
        StringColumn(
          "owner_resource",
          "owner_resource",
          Option("The type of resource that the metafield is attached to."),
          isNullable = true
        ),
        "/owner_resource"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Option("The date and time (ISO 8601 format) when the metafield was last updated."),
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          "value",
          "value",
          Option(
            "The data to store in the metafield. The value is always stored as a string, regardless of the metafield's type."
          ),
          isNullable = true
        ),
        "/value"
      ),
      ShopifyColumn(
        StringColumn(
          "type",
          "type",
          Option(
            "The type of data that the metafield stores in the `value` field. Refer to the list of supported types."
          ),
          isNullable = true
        ),
        "/type"
      )
    )
}
