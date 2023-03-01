package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{BoolColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/user#get-users
class UserReader(
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
      columns = UserReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchUsers(lastSyncedValue)((users: Seq[JsonNode]) => {
      if (users.nonEmpty) {
        val records: Seq[Record] = users.map(UserReader.serialize)
        val userIds: Seq[String] = users.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(userIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }

  @throws[ShopifyClientException]
  private def fetchUsers(lastSyncedId: Option[String])(
      handler: (Seq[JsonNode] => Unit)
  ): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withLimit(limitSize).build()
    val latestId = lastSyncedId.getOrElse("")
    while (true) {
      val users: ShopifyPage[JsonNode] = client.getUsers(request)
      val newestUsers: Seq[JsonNode] = users.asScala.filter(_.at("/id").asText("") > latestId)
      handler(newestUsers)

      if (users.isEmpty || users.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(users.getNextPageInfo)
      }
    }
  }

}

object UserReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          name = "id",
          displayName = "id",
          description = Option("The ID of the user's staff."),
          isNullable = true
        ),
        path = "/id"
      ),
      ShopifyColumn(
        BoolColumn(
          name = "account_owner",
          displayName = "account_owner",
          description = Option("Whether the user is the owner of the Shopify account."),
          isNullable = true
        ),
        path = "/account_owner"
      ),
      ShopifyColumn(
        StringColumn(
          name = "bio",
          displayName = "bio",
          Option("The description the user has written for themselves."),
          isNullable = true
        ),
        path = "/bio"
      ),
      ShopifyColumn(
        StringColumn(
          name = "email",
          displayName = "email",
          Option("The user's email address."),
          isNullable = true
        ),
        path = "/email"
      ),
      ShopifyColumn(
        StringColumn(
          name = "first_name",
          displayName = "first_name",
          Option("The user's first name."),
          isNullable = true
        ),
        path = "/first_name"
      ),
      ShopifyColumn(
        StringColumn(
          name = "im",
          displayName = "im",
          Option("The user's IM account address."),
          isNullable = true
        ),
        path = "/im"
      ),
      ShopifyColumn(
        StringColumn(
          name = "last_name",
          displayName = "last_name",
          Option("The user's last name."),
          isNullable = true
        ),
        path = "/last_name"
      ),
      ShopifyColumn(
        StringColumn(
          name = "permissions",
          displayName = "permissions",
          Option("The permissions granted to the user's staff account."),
          isNullable = true
        ),
        path = "/permissions"
      ),
      ShopifyColumn(
        StringColumn(
          name = "phone",
          displayName = "phone",
          Option("The user's phone number."),
          isNullable = true
        ),
        path = "/phone"
      ),
      ShopifyColumn(
        Int64Column(
          name = "receive_announcements",
          displayName = "receive_announcements",
          Option("Whether this account will receive email announcements from Shopify. Valid values: 0, 1"),
          isNullable = true
        ),
        path = "/receive_announcements"
      ),
      ShopifyColumn(
        StringColumn(
          name = "screen_name",
          displayName = "screen_name",
          Option("This property is deprecated."),
          isNullable = true
        ),
        path = "/screen_name"
      ),
      ShopifyColumn(
        StringColumn(
          name = "url",
          displayName = "url",
          Option("The user's homepage or other web address."),
          isNullable = true
        ),
        path = "/url"
      ),
      ShopifyColumn(
        StringColumn(
          name = "locale",
          displayName = "locale",
          Option(
            "The user's preferred locale. Locale values use the format language or language-COUNTRY, where language is a two-letter language code, and COUNTRY is a two-letter country code. For example: en or en-US"
          ),
          isNullable = true
        ),
        path = "/locale"
      ),
      ShopifyColumn(
        StringColumn(
          name = "user_type",
          displayName = "user_type",
          Option("The type of account the user has."),
          isNullable = true
        ),
        path = "/user_type"
      )
    )
}
