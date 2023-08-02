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

class CommentReader(
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
      columns = CommentReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(reportData: (Seq[Record], String) => Unit) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchComments(lastSyncedValue)((comments: Seq[JsonNode]) => {
      if (comments.nonEmpty) {
        val records: Seq[Record] = comments.map(CommentReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(comments.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchComments(lastSyncedId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastSyncedId.orNull).withLimit(limitSize).build()
    while (true) {
      val comments: ShopifyPage[JsonNode] = client.getComments(request)
      handler(comments.asScala)

      if (comments.isEmpty || comments.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(comments.getNextPageInfo)
      }
    }
  }

}

object CommentReader {
  def serialize(node: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, node))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] = Array[ShopifyColumn](
    ShopifyColumn(
      Int64Column(
        name = "id",
        displayName = "id",
        description = Option("A unique numeric identifier for the comment."),
        isNullable = true
      ),
      path = "/id"
    ),
    ShopifyColumn(
      Int64Column(
        name = "article_id",
        displayName = "article_id",
        description = Option("A unique numeric identifier for the article that the comment belongs to."),
        isNullable = true
      ),
      path = "/article_id"
    ),
    ShopifyColumn(
      Int64Column(
        name = "blog_id",
        displayName = "blog_id",
        Option("A unique numeric identifier for the blog containing the article that the comment belongs to."),
        isNullable = true
      ),
      path = "/blog_id"
    ),
    ShopifyColumn(
      StringColumn(
        name = "author",
        displayName = "author",
        Option("The name of the author of the comment."),
        isNullable = true
      ),
      path = "/author"
    ),
    ShopifyColumn(
      StringColumn(name = "body", "body", Option("The basic Textile markup of a comment."), isNullable = true),
      path = "/body"
    ),
    ShopifyColumn(
      StringColumn(
        name = "body_html",
        displayName = "body_html",
        Option("The text of the comment, complete with HTML markup."),
        isNullable = true
      ),
      path = "/body_html"
    ),
    ShopifyColumn(
      DateTimeColumn(
        name = "created_at",
        displayName = "created_at",
        Option("The date and time (ISO 8601 format) when the comment was created."),
        isNullable = true
      ),
      path = "/created_at"
    ),
    ShopifyColumn(
      StringColumn(
        name = "email",
        displayName = "email",
        Option("The email address of the author of the comment."),
        isNullable = true
      ),
      path = "/email"
    ),
    ShopifyColumn(
      StringColumn(
        name = "ip",
        displayName = "ip",
        Option("The IP address from which the comment was posted."),
        isNullable = true
      ),
      path = "/ip"
    ),
    ShopifyColumn(
      DateTimeColumn(
        name = "published_at",
        displayName = "published_at",
        Option("The date and time (ISO 8601 format) when the comment was published."),
        isNullable = true
      ),
      path = "/published_at"
    ),
    ShopifyColumn(
      StringColumn(
        name = "status",
        displayName = "status",
        Option("The status of the comment."),
        isNullable = true
      ),
      path = "/status"
    ),
    ShopifyColumn(
      DateTimeColumn(
        name = "updated_at",
        displayName = "updated_at",
        Option(
          "The date and time (ISO 8601 format) when the comment was last modified. When the comment is created, this matches the value of created_at. If the blog requires comments to be approved, then this value is updated to the date and time when the comment is approved."
        ),
        isNullable = true
      ),
      path = "/updated_at"
    ),
    ShopifyColumn(
      StringColumn(
        name = "user_agent",
        displayName = "user_agent",
        Option("The user agent string provided by the software used to create the comment (usually a browser)."),
        isNullable = true
      ),
      path = "/user_agent"
    )
  )
}
