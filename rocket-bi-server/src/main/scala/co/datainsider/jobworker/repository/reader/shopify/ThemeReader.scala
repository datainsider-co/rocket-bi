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

class ThemeReader(
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
      columns = ThemeReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchThemes(lastSyncedValue)((themes: Seq[JsonNode]) => {
      if (themes.nonEmpty) {
        val records: Seq[Record] = themes.map(ThemeReader.serialize)
        val themeIds: Seq[String] = themes.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(themeIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchThemes(lastSyncedId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withLimit(limitSize).build()
    val latestId: String = lastSyncedId.getOrElse("")
    while (true) {
      val themes: ShopifyPage[JsonNode] = client.getThemes(request)
      val newestThemes: Seq[JsonNode] = themes.asScala.filter(theme => theme.at("/id").asText("") > latestId)
      handler(newestThemes)

      if (themes.isEmpty || themes.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(themes.getNextPageInfo)
      }

    }
  }

}

object ThemeReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("The unique numeric identifier for the theme."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "created_at",
          displayName = "created_at",
          description = Option("The date and time when the theme was created. (format: 2014-04-25T16:15:47-04:00)"),
          isNullable = true
        ),
        path = "/created_at"
      ),
      ShopifyColumn(
        StringColumn(name = "name", displayName = "name", Option("The name of the theme."), isNullable = true),
        path = "/name"
      ),
      ShopifyColumn(
        BoolColumn(
          name = "previewable",
          displayName = "previewable",
          Option("Whether the theme can currently be previewed."),
          isNullable = true
        ),
        path = "/previewable"
      ),
      ShopifyColumn(
        BoolColumn(
          name = "processing",
          displayName = "processing",
          Option("Whether files are still being copied into place for this theme."),
          isNullable = true
        ),
        path = "/processing"
      ),
      ShopifyColumn(
        StringColumn(
          name = "role",
          displayName = "role",
          Option("Specifies how the theme is being used within the shop."),
          isNullable = true
        ),
        path = "/role"
      ),
      ShopifyColumn(
        Int64Column(
          name = "theme_store_id",
          displayName = "theme_store_id",
          Option(
            "A unique identifier applied to Shopify-made themes that are installed from the Shopify Theme Store Theme Store. Not all themes available in the Theme Store are developed by Shopify. Returns null if the store's theme isn't made by Shopify, or if it wasn't installed from the Theme Store."
          ),
          isNullable = true
        ),
        path = "/theme_store_id"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "updated_at",
          displayName = "updated_at",
          Option("The date and time of when the theme was last updated. (format: 2014-04-25T16:15:47-04:00)."),
          isNullable = true
        ),
        path = "/updated_at"
      )
    )
}
