package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.Ids.DirectoryId
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future

import scala.collection.mutable.ArrayBuffer

trait StarredDirectoryRepository {

  def list(organizationId: Long, username: String, from: Int, size: Int): Future[Array[DirectoryId]]

  def star(organizationId: Long, username: String, directoryId: DirectoryId): Future[Boolean]

  def unstar(organizationId: Long, username: String, directoryId: DirectoryId): Future[Boolean]

  def count(organizationId: Long, username: String): Future[Int]

  def deleteByUsername(organizationId: DirectoryId, username: String): Future[Boolean]

  def deleteByOrgId(organizationId: DirectoryId): Future[Boolean]
}

class MysqlStarredDirectoryRepository @Inject() (
    @Named("mysql") client: JdbcClient,
    dbName: String,
    tblName: String
) extends StarredDirectoryRepository {
  override def list(organizationId: Long, username: String, from: Int, size: Int): Future[Array[DirectoryId]] =
    Future {
      val query =
        s"""
           |select directory_id
           |from $dbName.$tblName
           |where organization_id = ? AND username = ?
           |limit $size offset $from
           |""".stripMargin
      client.executeQuery(query, organizationId, username)(rs => {
        val directoryIds = ArrayBuffer[DirectoryId]()
        while (rs.next()) {
          directoryIds += rs.getLong("directory_id")
        }
        directoryIds.toArray
      })
    }

  override def count(organizationId: Long, username: String): Future[Int] =
    Future {
      val query =
        s"""
         |select count(*)
         |from $dbName.$tblName
         |where organization_id = ? AND username = ?
         |""".stripMargin

      client.executeQuery(query, organizationId, username)(rs => if (rs.next()) rs.getInt(1) else 0)
    }

  override def star(organizationId: Long, username: String, directoryId: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
           |insert into $dbName.$tblName
           |(organization_id, username, directory_id)
           |values (?, ?, ?)
           |""".stripMargin
      if (isStarred(organizationId, username, directoryId))
        true
      else
        client.executeUpdate(query, organizationId, username, directoryId) > 0
    }

  override def unstar(organizationId: Long, username: String, directoryId: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
           |delete from $dbName.$tblName
           |where organization_id = ? AND username = ? AND directory_id = ?
           |""".stripMargin
      if (isStarred(organizationId, username, directoryId))
        client.executeUpdate(query, organizationId, username, directoryId) > 0
      else
        true
    }

  private def isStarred(organizationId: Long, username: String, directoryId: DirectoryId): Boolean = {
    val query =
      s"""
         |select *
         |from $dbName.$tblName
         |where organization_id = ? AND username = ? AND directory_id = ?
         |""".stripMargin
    client.executeQuery(query, organizationId, username, directoryId)(rs => {
      if (rs.next())
        true
      else
        false
    })
  }

  override def deleteByUsername(organizationId: DirectoryId, username: String): Future[Boolean] =
    Future {
      val query =
        s"""
             |delete from $dbName.$tblName
             |where organization_id = ? AND username = ?
             |""".stripMargin
      client.executeUpdate(query, organizationId, username) > 0
    }

  override def deleteByOrgId(organizationId: DirectoryId): Future[Boolean] =
    Future {
      {
        val query = s"""
                   |delete from $dbName.$tblName
                   |where organization_id = ?
                   |""".stripMargin
        client.executeUpdate(query, organizationId) > 0
      }
    }
}
