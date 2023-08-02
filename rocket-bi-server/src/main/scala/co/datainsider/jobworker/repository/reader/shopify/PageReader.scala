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

class PageReader(
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
      columns = PageReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchPages(lastSyncedValue)((pages: Seq[JsonNode]) => {
      if (pages.nonEmpty) {
        val records: Seq[Record] = pages.map(PageReader.serialize)
        val pageIds: Seq[String] = pages.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(pageIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchPages(lastSyncedId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastSyncedId.orNull).withLimit(limitSize).build()
    while (true) {
      val pages: ShopifyPage[JsonNode] = client.getPages(request)
      handler(pages.asScala)

      if (pages.isEmpty || pages.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(pages.getNextPageInfo)
      }

    }
  }

}

object PageReader {
  def serialize(node: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("The unique numeric identifier for the page."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "author",
          displayName = "author",
          Option("The name of the person who created the page."),
          isNullable = true
        ),
        path = "/author"
      ),
      ShopifyColumn(
        StringColumn(
          name = "body_html",
          displayName = "body_html",
          Option("The text content of the page, complete with HTML markup."),
          isNullable = true
        ),
        path = "/body_html"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "created_at",
          displayName = "created_at",
          Option("The date and time (ISO 8601 format) when the page was created."),
          isNullable = true
        ),
        path = "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "handle",
          displayName = "handle",
          Option(
            "A unique, human-friendly string for the page, generated automatically from its title. In themes, the Liquid templating language refers to a page by its handle."
          ),
          isNullable = true
        ),
        path = "/handle"
      ),
      ShopifyColumn(
        StringColumn(
          name = "metafield",
          displayName = "metafield",
          Option("Additional information attached to the Page object."),
          isNullable = true
        ),
        path = "/metafield"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "published_at",
          displayName = "published_at",
          Option(
            "The date and time (ISO 8601 format) when the page was published. Returns null when the page is hidden."
          ),
          isNullable = true
        ),
        path = "/published_at"
      ),
      ShopifyColumn(
        Int64Column(
          name = "shop_id",
          displayName = "shop_id",
          Option("The ID of the shop to which the page belongs."),
          isNullable = true
        ),
        path = "/shop_id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "template_suffix",
          displayName = "template_suffix",
          Option(
            "The suffix of the template that is used to render the page. If the value is an empty string or null, then the default page template is used."
          ),
          isNullable = true
        ),
        path = "/template_suffix"
      ),
      ShopifyColumn(
        StringColumn(name = "title", displayName = "title", Option("The title of the page."), isNullable = true),
        path = "/title"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "updated_at",
          displayName = "updated_at",
          Option("The date and time (ISO 8601 format) when the page was last updated."),
          isNullable = true
        ),
        path = "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "admin_graphql_api_id",
          displayName = "admin_graphql_api_id",
          Option("The GraphQL GID of the page."),
          isNullable = true
        ),
        path = "/admin_graphql_api_id"
      )
    )
}
