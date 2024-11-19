package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.Ids.DirectoryId
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future

import scala.collection.mutable.ArrayBuffer

trait RecentDirectoryRepository {
  def list(organizationId: Long, username: String, from: Int, size: Int): Future[Array[DirectoryId]]

  def addOrUpdate(organizationId: Long, username: String, id: DirectoryId): Future[Boolean]

  def delete(organizationId: Long, id: DirectoryId): Future[Boolean]

  def deleteByOrgId(organizationId: DirectoryId): Future[Boolean]
}

class MsqlRecentDirectoryRepository @Inject() (
    @Named("mysql") client: JdbcClient,
    dbName: String,
    tblName: String
) extends RecentDirectoryRepository {

  override def list(organizationId: Long, username: String, from: Int, size: Int): Future[Array[DirectoryId]] =
    Future {
      val query =
        s"""
        |select *
        |from $dbName.$tblName
        |where organization_id = ? AND username = ?
        |order by last_seen_time desc
        |limit ? offset ?
        |""".stripMargin

      client.executeQuery(query, organizationId, username, size, from)(rs => {
        val directoryIds = ArrayBuffer[DirectoryId]()
        while (rs.next()) {
          directoryIds += rs.getLong("directory_id")
        }
        directoryIds.toArray
      })
    }

  override def addOrUpdate(organizationId: DirectoryId, username: String, id: DirectoryId): Future[Boolean] =
    Future {
      val query: String = isExist(organizationId, username, id) match {
        case true =>
          s"""
          |update $dbName.$tblName
          |set last_seen_time = ?
          |where organization_id = ? AND username = ? AND directory_id = ?
          |""".stripMargin
        case false =>
          s"""
          |insert into $dbName.$tblName
          |(last_seen_time, organization_id, username, directory_id)
          |values (? ,? ,?, ?)
          |""".stripMargin
      }
      client.executeUpdate(query, System.currentTimeMillis(), organizationId, username, id) > 0
    }

  private def isExist(organizationId: DirectoryId, username: String, id: DirectoryId): Boolean = {
    val query =
      s"""
           |select *
           |from $dbName.$tblName
           |where organization_id = ? AND username = ? AND directory_id = ?
           |""".stripMargin
    client.executeQuery(query, organizationId, username, id)(rs => {
      if (rs.next())
        true
      else
        false
    })
  }

  override def delete(organizationId: DirectoryId, id: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
         |delete from $dbName.$tblName
         |where organization_id = ? AND directory_id = ?
         |""".stripMargin
      client.executeUpdate(query, organizationId, id) > 0
    }

  override def deleteByOrgId(organizationId: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
         |delete from $dbName.$tblName
         |where organization_id = ?
         |""".stripMargin
      client.executeUpdate(query, organizationId) > 0
    }
}
