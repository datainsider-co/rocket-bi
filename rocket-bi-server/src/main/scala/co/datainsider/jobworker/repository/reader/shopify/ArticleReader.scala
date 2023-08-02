package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{BoolColumn, DateTimeColumn, Int64Column, StringColumn}
import co.datainsider.bi.client.JdbcClient.Record
import ShopifyReader.ImplicitJsonNode
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

class ArticleReader(
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
      columns = ArticleReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(reportData: (Seq[Record], String) => Unit): Unit = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchBlogIds()((blogIds: Seq[String]) => {
      blogIds.foreach(blogId => {
        try {
          fetchArticles(blogId, lastSyncedValue) { (articles: Seq[JsonNode]) =>
            {
              if (articles.nonEmpty) {
                val records: Seq[Record] = articles.map(ArticleReader.serialize)
                val latestId: String = ShopifyReader.getLatestId(articles.map(_.at("/id").asText()))
                currentLatestId = ShopifyReader.max(latestId, currentLatestId)
                reportData(records, currentLatestId)
              }
            }
          }
        } catch {
          case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
            warn(s"get articles of blog ${blogId} not found")
        }
      })
    })
  }

  @throws[ShopifyClientException]
  private def fetchBlogIds()(handler: (Seq[String] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withFields("id").withLimit(limitSize).build()
    while (true) {
      val blogs: ShopifyPage[JsonNode] = client.getBlogs(request)
      val blogIds: Seq[String] =
        blogs.asScala.filter(blog => blog.at("/id").isExists()).map(blog => blog.at("/id").asText())
      handler(blogIds)

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

  @throws[ShopifyClientException]
  @throws[ShopifyErrorResponseException]
  private def fetchArticles(blogId: String, lastSyncId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastSyncId.orNull).withLimit(limitSize).build()
    while (true) {
      val articles: ShopifyPage[JsonNode] = client.getArticles(blogId, request)
      handler(articles.asScala)

      if (articles.isEmpty || articles.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(articles.getNextPageInfo)
      }
    }
  }
}

object ArticleReader {
  def serialize(node: JsonNode): Record = {
    LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Some("The ID of the article."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "author",
          displayName = "author",
          description = Some("The name of the author of the article."),
          isNullable = true
        ),
        path = "/author"
      ),
      ShopifyColumn(
        Int64Column(
          name = "blog_id",
          displayName = "blog_id",
          description = Some("The ID of the blog containing the article."),
          isNullable = true
        ),
        path = "/blog_id"
      ),
      ShopifyColumn(
        StringColumn(
          name = "body_html",
          displayName = "body_html",
          description = Some("The text of the body of the article, complete with HTML markup."),
          isNullable = true
        ),
        path = "/body_html"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "created_at",
          displayName = "created_at",
          description = Some("The date and time (ISO 8601 format) when the article was created."),
          isNullable = true
        ),
        path = "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "handle",
          displayName = "handle",
          isNullable = true,
          description = Some(
            "A human-friendly unique string for the article that's automatically generated from the article's title. The handle is used in the article's URL."
          )
        ),
        path = "/handle"
      ),
      ShopifyColumn(
        StringColumn(
          name = "image",
          displayName = "image",
          isNullable = true,
          description = Some("An image associated with the article.")
        ),
        path = "/image"
      ),
      ShopifyColumn(
        StringColumn(
          name = "metafields",
          displayName = "metafields",
          description = Some("The additional information attached to an Article object."),
          isNullable = true
        ),
        path = "/metafields"
      ),
      ShopifyColumn(
        BoolColumn(
          name = "published",
          displayName = "published",
          description = Some("Whether the article is visible."),
          isNullable = true
        ),
        path = "/published"
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "published_at",
          displayName = "published_at",
          description = Some("The date and time (ISO 8601 format) when the article was published."),
          isNullable = true
        ),
        path = "/published_at"
      ),
      ShopifyColumn(
        StringColumn(
          name = "summary_html",
          displayName = "summary_html",
          description = Some(
            "A summary of the article, which can include HTML markup. The summary is used by the online store theme to display the article on other pages, such as the home page or the main blog page."
          ),
          isNullable = true
        ),
        path = "/summary_html"
      ),
      ShopifyColumn(
        StringColumn(
          name = "tags",
          displayName = "tags",
          description = Some(
            "A comma-separated list of tags. Tags are additional short descriptors formatted as a string of comma-separated values."
          ),
          isNullable = true
        ),
        path = "/tags"
      ),
      ShopifyColumn(
        StringColumn(
          name = "template_suffix",
          displayName = "template_suffix",
          description = Some(
            "The name of the template an article is using if it's using an alternate template. If an article is using the default article.liquid template, then the value returned is null."
          ),
          isNullable = true
        ),
        path = "/template_suffix"
      ),
      ShopifyColumn(
        StringColumn(name = "title", displayName = "title", description = Some("The title of the article."),           isNullable = true
        ),
        path = "/title",
      ),
      ShopifyColumn(
        DateTimeColumn(
          name = "updated_at",
          displayName = "updated_at",
          description = Some("The date and time (ISO 8601 format) when the article was last updated."),
          isNullable = true
        ),
        path = "/updated_at"
      ),
      ShopifyColumn(
        Int64Column(
          name = "user_id",
          displayName = "user_id",
          description = Some("A unique numeric identifier for the author of the article."),
          isNullable = true
        ),
        path = "/user_id"
      )
    )
}
