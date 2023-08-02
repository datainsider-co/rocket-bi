package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, DoubleColumn, Int64Column, StringColumn}
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

class AssetReader(
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
      columns = AssetReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(reportData: (Seq[Record], String) => Unit) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchAllThemes(lastSyncedValue)((themeIds: Seq[String]) => {
      themeIds.foreach((themeId: String) => {
        val assets: Seq[JsonNode] = getAssets(themeId);
        if (assets.nonEmpty) {
          val records: Seq[Record] = assets.map(AssetReader.serialize)
          currentLatestId = ShopifyReader.max(themeId, currentLatestId)
          reportData(records, currentLatestId)
        }
      })
    })
  }

  @throws[ShopifyClientException]
  private def fetchAllThemes(lastSyncedValue: Option[String])(handler: ((Seq[String]) => Unit)): Unit = {
    val latestId = lastSyncedValue.getOrElse("")
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withFields("id").withLimit(limitSize).build()
    while (true) {
      val themes: ShopifyPage[JsonNode] = client.getThemes(request)
      val newestIds: Seq[String] = themes.asScala.map(_.at("/id").asText("")).filter(id => id > latestId)
      handler(newestIds)

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

  private def getAssets(themeId: String): Seq[JsonNode] = {
    try {
      client.getAssets(themeId).asScala
    } catch {
      case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
        warn(s"get assets of theme ${themeId} not found")
        Seq.empty[JsonNode]
    }
  }

}

object AssetReader {
  def serialize(node: JsonNode): Record = {
    LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        StringColumn(
          name = "key",
          displayName = "key",
          description = Some(
            "The path to the asset within a theme. It consists of the file's directory and filename. For example, the asset assets/bg-body-green.gif is in the assets directory, so its key is assets/bg-body-green.gif."
          ),
          isNullable = true
        ),
        path = "/key"
      ),
      ShopifyColumn(
        StringColumn(
          name = "attachment",
          displayName = "attachment",
          description = Some("A base64-encoded image."),
          isNullable = true
        ),
        path = "/attachment"
      ),
      ShopifyColumn(
        StringColumn(
          name = "checksum",
          displayName = "checksum",
          Some(
            "The MD5 representation of the content, consisting of a string of 32 hexadecimal digits. May be null if an asset has not been updated recently."
          ),
          isNullable = true
        ),
        path = "/checksum"
      ),
      ShopifyColumn(
        StringColumn(
          name = "content_type",
          displayName = "content_type",
          description =
            Option("The MIME representation of the content, consisting of the type and subtype of the asset."),
          isNullable = true
        ),
        path = "/content_type"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "created_at",
          displayName = "created_at",
          description = Option("The date and time (ISO 8601 format) when the asset was created."),
          isNullable = true
        ),
        path = "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "public_url",
          displayName = "public_url",
          description = Some("The public-facing URL of the asset."),
          isNullable = true
        ),
        path = "/public_url"
      ),
      ShopifyColumn(
        DoubleColumn("size", "size", Option("The asset size in bytes."), isNullable = true),
        path = "/size"
      ),
      ShopifyColumn(
        Int64Column(
          "theme_id",
          "theme_id",
          Option("The ID for the theme that an asset belongs to."),
          isNullable = true
        ),
        path = "/theme_id"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "updated_at",
          displayName = "updated_at",
          Option("The date and time (ISO 8601 format) when an asset was last updated."),
          isNullable = true
        ),
        path = "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "value",
          displayName = "value",
          Option("The text content of the asset, such as the HTML and Liquid markup of a template file."),
          isNullable = true
        ),
        path = "/value"
      )
    )
}
