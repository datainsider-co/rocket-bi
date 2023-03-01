package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

// https://shopify.dev/api/admin-rest/2022-04/resources/redirect#top
class RedirectReader(
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
      columns = RedirectReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchRedirects(lastSyncedValue)((redirects: Seq[JsonNode]) => {
      if (redirects.nonEmpty) {
        val records: Seq[Record] = redirects.map(RedirectReader.serialize)
        val redirectIds: Seq[String] = redirects.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(redirectIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchRedirects(lastId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val redirects: ShopifyPage[JsonNode] = client.getRedirects(request)
      handler(redirects.asScala)

      if (redirects.isEmpty || redirects.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(redirects.getNextPageInfo)
      }

    }
  }
}

object RedirectReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("id"),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "path",
          displayName = "path",
          description = Option(
            "The old path to be redirected. When the user visits this path, they will be redirected to the target. (maximum: 1024 characters)"
          ),
          isNullable = true
        ),
        path = "/path"
      ),
      ShopifyColumn(
        StringColumn(
          name = "target",
          displayName = "target",
          description = Option(
            "The target location where the user will be redirected. When the user visits the old path specified by the path property, they will be redirected to this location. This property can be set to any path on the shop's site, or to an external URL. (maximum: 255 characters)"
          ),
          isNullable = true
        ),
        path = "/target"
      )
    )
}
