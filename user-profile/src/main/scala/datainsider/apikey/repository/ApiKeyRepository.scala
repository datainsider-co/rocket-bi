package datainsider.apikey.repository

import com.twitter.util.Future
import datainsider.apikey.domain.ApiKeyInfo
import datainsider.apikey.domain.request.SortRequest
import datainsider.client.util.JdbcClient

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait ApiKeyRepository {
  def insert(apiKeyInfo: ApiKeyInfo): Future[ApiKeyInfo]

  def get(apiKey: String): Future[Option[ApiKeyInfo]]

  def list(
      organizationId: Long,
      keyword: String,
      from: Int,
      size: Int,
      sorts: Seq[SortRequest]
  ): Future[Seq[ApiKeyInfo]]

  def update(
      organizationId: Long,
      apiKey: String,
      displayName: String,
      expiredTimeMs: Long,
      updatedBy: String,
      updatedAt: Long
  ): Future[Boolean]

  def delete(organizationId: Long, apikey: String): Future[Boolean]

  def count(organizationId: Long, keyword: String): Future[Long]
}

class MysqlApikeyRepository(client: JdbcClient, dbName: String, tblName: String) extends ApiKeyRepository {

  override def get(apiKey: String): Future[Option[ApiKeyInfo]] =
    Future {
      val query =
        s"""
           |select * from $dbName.$tblName
           |where api_key = ?
           |""".stripMargin
      client.executeQuery(query, apiKey)(rs => {
        if (rs.next()) {
          Some(toApiKeyInfo(rs))
        } else {
          None
        }
      })
    }

  override def insert(apiKeyInfo: ApiKeyInfo): Future[ApiKeyInfo] =
    Future {
      val query = {
        s"""
           |insert into $dbName.`$tblName`(organization_id, api_key, display_name, expired_time, created_at, created_by, updated_at, updated_by)
           |values(?, ?, ?, ?, ?, ?, ?, ?)
           |""".stripMargin
      }
      val isSuccess: Boolean = client.executeUpdate(
        query,
        apiKeyInfo.organizationId,
        apiKeyInfo.apiKey,
        apiKeyInfo.displayName,
        apiKeyInfo.expiredTimeMs,
        apiKeyInfo.createdAt,
        apiKeyInfo.createdBy.orNull,
        apiKeyInfo.updatedAt,
        apiKeyInfo.updatedBy.orNull
      ) > 0
      if (isSuccess) {
        apiKeyInfo
      } else {
        throw new InternalError("Got error when saving api key")
      }
    }

  override def list(
      organizationId: Long,
      keyword: String,
      from: Int,
      size: Int,
      sorts: Seq[SortRequest]
  ): Future[Seq[ApiKeyInfo]] =
    Future {
      val orderStatement: String =
        if (sorts.nonEmpty) {
          "order by " + sorts.map(sort => s"`${sort.field}` ${sort.order}").mkString(",")
        } else {
          ""
        }
      val query =
        s"""
           |select * from $dbName.$tblName
           |where organization_id = ? and display_name like ?
           |$orderStatement
           |limit ? offset ?
           |""".stripMargin
      client.executeQuery(query, organizationId, s"%$keyword%", size, from)(rs => {
        val result = ArrayBuffer.empty[ApiKeyInfo]
        while (rs.next()) {
          result += toApiKeyInfo(rs)
        }
        result
      })
    }

  override def update(
      organizationId: Long,
      apiKey: String,
      displayName: String,
      expiredTimeMs: Long,
      updatedBy: String,
      updatedAt: Long
  ): Future[Boolean] =
    Future {
      val query =
        s"""
           |update $dbName.$tblName
           |set display_name = ?, expired_time = ?, updated_at = ?, updated_by= ?
           |where api_key = ? and organization_id = ?
           |""".stripMargin

      client.executeUpdate(
        query,
        displayName,
        expiredTimeMs,
        updatedAt,
        updatedBy,
        apiKey,
        organizationId
      ) > 0
    }

  override def delete(organizationId: Long, apikey: String): Future[Boolean] =
    Future {
      val query =
        s"""
           |delete from $dbName.$tblName
           |where organization_id = ? and api_key = ?
           |""".stripMargin

      client.executeUpdate(query, organizationId, apikey) > 0
    }

  override def count(organizationId: Long, keyword: String): Future[Long] =
    Future {
      val query =
        s"""
           |select count(*) from $dbName.$tblName
           |where organization_id = ? and display_name like ?
           |""".stripMargin

      client.executeQuery(query, organizationId, s"%$keyword%")(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else {
          0
        }
      })
    }

  private def toApiKeyInfo(rs: ResultSet): ApiKeyInfo = {
    ApiKeyInfo(
      organizationId = rs.getLong("organization_id"),
      apiKey = rs.getString("api_key"),
      displayName = rs.getString("display_name"),
      expiredTimeMs = rs.getLong("expired_time"),
      createdAt = rs.getLong("created_at"),
      updatedAt = rs.getLong("updated_at"),
      createdBy = Option(rs.getString("created_by")),
      updatedBy = Option(rs.getString("updated_by"))
    )
  }
}
