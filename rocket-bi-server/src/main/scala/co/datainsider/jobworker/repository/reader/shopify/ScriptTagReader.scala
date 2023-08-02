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

// https://shopify.dev/api/admin-rest/2022-04/resources/scripttag#get-script-tags
class ScriptTagReader(
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
      columns = ScriptTagReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchScriptTags(lastSyncedValue)((scriptTags: Seq[JsonNode]) => {
      if (scriptTags.nonEmpty) {
        val records: Seq[Record] = scriptTags.map(ScriptTagReader.serialize)
        val scriptTagIds: Seq[String] = scriptTags.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(scriptTagIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchScriptTags(lastId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val scriptTags: ShopifyPage[JsonNode] = client.getScriptTags(request)
      handler(scriptTags.asScala)

      if (scriptTags.isEmpty || scriptTags.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(scriptTags.getNextPageInfo)
      }

    }
  }
}

object ScriptTagReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("The ID for the script tag."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "src",
          displayName = "src",
          description = Option("The URL of the remote script."),
          isNullable = true
        ),
        path = "/src"
      ),
      ShopifyColumn(
        StringColumn(
          name = "display_scope",
          displayName = "display_scope",
          description = Option("The page or pages on the online store where the script should be included."),
          isNullable = true
        ),
        path = "/display_scope"
      ),
      ShopifyColumn(
        StringColumn(
          name = "event",
          displayName = "event",
          description = Option("The DOM event that triggers the loading of the script."),
          isNullable = true
        ),
        path = "/event"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "created_at",
          displayName = "created_at",
          description = Option("The date and time (ISO 8601) when the script tag was created."),
          isNullable = true
        ),
        path = "/created_at"
      ),
      ShopifyColumn(
        BoolColumn(
          name = "cache",
          displayName = "cache",
          description = Option("Whether the Shopify CDN can cache and serve the script tag."),
          isNullable = true
        ),
        path = "/cache"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "updated_at",
          displayName = "updated_at",
          description = Option("The date and time (ISO 8601) when the script tag was last updated."),
          isNullable = true
        ),
        path = "/updated_at"
      )
    )
}
