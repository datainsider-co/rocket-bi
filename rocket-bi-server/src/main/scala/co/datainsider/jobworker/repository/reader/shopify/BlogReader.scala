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

class BlogReader(
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
      columns = BlogReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchBlogs(lastSyncedValue)((blogs: Seq[JsonNode]) => {
      if (blogs.nonEmpty) {
        val records: Seq[Record] = blogs.map(BlogReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(blogs.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchBlogs(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val blogs: ShopifyPage[JsonNode] = client.getBlogs(request)
      handler(blogs.asScala)

      if (blogs.isEmpty || blogs.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(blogs.getNextPageInfo)
      }
    }
  }
}

object BlogReader {
  def serialize(node: JsonNode): Record = {
    LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("A unique numeric identifier for the blog."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "commentable",
          displayName = "commentable",
          description =
            Option("Indicates whether readers can post comments to the blog and if comments are moderated or not."),
          isNullable = true
        ),
        path = "/commentable"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "created_at",
          displayName = "created_at",
          description = Option(
            "The date and time when the blog was created. The API returns this value in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          ),
          isNullable = true
        ),
        path = "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "feedburner",
          displayName = "feedburner",
          description = Option(
            "FeedBurner is a web feed management provider and can be enabled to provide custom RSS feeds for Shopify bloggers. Google has stopped supporting FeedBurner, and new or existing blogs that are not already integrated with FeedBurner can't use the service. This property will default to blank unless FeedBurner is enabled."
          ),
          isNullable = true
        ),
        path = "/feedburner"
      ),
      ShopifyColumn(
        StringColumn(
          name = "feedburner_location",
          displayName = "feedburner_location",
          description = Option(
            "The URL that points to the FeedBurner location for blogs that have FeedBurner enabled. Google has stopped supporting FeedBurner, and new or existing blogs that are not already integrated with FeedBurner can't use the service. This property will default to blank unless FeedBurner is enabled"
          ),
          isNullable = true
        ),
        path = "/feedburner_location"
      ),
      ShopifyColumn(
        StringColumn(
          name = "handle",
          displayName = "handle",
          description = Option(
            "A human-friendly unique string that is automatically generated from the title if no handle is sent during the creation of a blog. Duplicate handles are appended with an incremental number, for example, `blog-2`. The handle is customizable and is used by the Liquid templating language to refer to the blog. If you change the handle of a blog, then it can negatively affect the SEO of the shop. We recommend that you create a URL redirect to avoid any SEO issues."
          ),
          isNullable = true
        ),
        path = "/handle"
      ),
      ShopifyColumn(
        StringColumn(
          name = "metafields",
          displayName = "metafields",
          description = Option("Attaches additional metadata to a store's"),
          isNullable = true
        ),
        path = "/metafields"
      ),
      ShopifyColumn(
        StringColumn(
          name = "tags",
          displayName = "tags",
          description = Option(
            "A list of tags associated with the 200 most recent blog articles. Tags are additional short descriptors formatted as a string of comma-separated values. For example, if an article has three tags: tag1, tag2, tag3. Tags are limited to 255 characters."
          ),
          isNullable = true
        ),
        path = "/tags"
      ),
      ShopifyColumn(
        StringColumn(
          name = "template_suffix",
          displayName = "template_suffix",
          description = Option(
            "States the name of the template a blog is using if it is using an alternate template. If a blog is using the default blog.liquid template, the value returned is \"null\"."
          ),
          isNullable = true
        ),
        path = "/template_suffix"
      ),
      ShopifyColumn(
        StringColumn(
          name = "title",
          displayName = "title",
          description = Option("The title of the blog."),
          isNullable = true
        ),
        path = "/title"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "updated_at",
          displayName = "updated_at",
          description = Option(
            "The date and time when changes were last made to the blog's properties. Note that this is not updated when creating, modifying or deleting articles in the blog. The API returns this value in ISO 8601 format."
          ),
          isNullable = true
        ),
        path = "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "admin_graphql_api_id",
          displayName = "admin_graphql_api_id",
          description = Option("The GraphQL GID of the blog."),
          isNullable = true
        ),
        path = "/admin_graphql_api_id"
      )
    )
}
