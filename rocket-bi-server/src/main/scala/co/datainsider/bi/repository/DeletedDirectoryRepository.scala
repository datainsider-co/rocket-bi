package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.request.{ListDirectoriesRequest, Sort}
import co.datainsider.bi.domain.{Directory, DirectoryType}
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future
import datainsider.client.exception.NotFoundError

import java.sql.ResultSet
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

trait DeletedDirectoryRepository {
  def insert(orgId: Long, directory: Directory): Future[Boolean]

  def multiInsert(orgId: Long, directories: Seq[Directory]): Future[Boolean]

  def list(orgId: Long, request: ListDirectoriesRequest): Future[Array[Directory]]

  def get(orgId: Long, id: DirectoryId): Future[Option[Directory]]

  def delete(orgId: Long, id: DirectoryId): Future[Boolean]

  def multiDelete(orgId: Long, ids: Seq[DirectoryId]): Future[Boolean]

  def deleteByOwnerId(orgId: Long, username: String): Future[Boolean]

  def isExist(orgId: Long, id: DirectoryId): Future[Boolean]

  /**
    * get all sub directories of a directory
    */
  def getSubDirectories(orgId: Long, parentId: DirectoryId): Future[Array[Directory]]
}

class MysqlDeletedDirectoryRepository @Inject() (
    @Named("mysql") client: JdbcClient,
    dbName: String,
    tblName: String
) extends DeletedDirectoryRepository {

  override def insert(orgId: Long, directory: Directory): Future[Boolean] = {
    Future {
      val query =
        s"""
           |insert into $dbName.$tblName
           |(org_id, id, name, creator_id, owner_id, created_date, parent_id, dir_type, dashboard_id, deleted_date, updated_date)
           |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           |""".stripMargin

      client.executeUpdate(
        query,
        directory.orgId,
        directory.id,
        directory.name,
        directory.creatorId,
        directory.ownerId,
        directory.createdDate,
        directory.parentId,
        directory.directoryType.toString,
        directory.dashboardId.orNull,
        System.currentTimeMillis(),
        directory.updatedDate.getOrElse(System.currentTimeMillis())
      ) > 0
    }
  }

  override def multiInsert(orgId: Long, directories: Seq[Directory]): Future[Boolean] = {
    Future {
      val query =
        s"""
           |insert into $dbName.$tblName
           |(org_id, id, name, creator_id, owner_id, created_date, parent_id, dir_type, dashboard_id, deleted_date, updated_date)
           |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           |""".stripMargin
      val data: Array[Record] = directories.map { directory =>
        Array(
          orgId,
          directory.id,
          directory.name,
          directory.creatorId,
          directory.ownerId,
          directory.createdDate,
          directory.parentId,
          directory.directoryType.toString,
          directory.dashboardId.getOrElse(null),
          System.currentTimeMillis(),
          directory.updatedDate.getOrElse(System.currentTimeMillis())
        )
      }.toArray
      client.executeBatchUpdate(query, data) > 0
    }
  }

  override def list(orgId: Long, request: ListDirectoriesRequest): Future[Array[Directory]] = {
    Future.value(listSync(orgId, request))
  }

  private def listSync(orgId: Long, request: ListDirectoriesRequest): Array[Directory] = {
    val selectClause = s"select * from $dbName.$tblName"
    val (whereClause, conditionValues): (String, Seq[Any]) = buildWhereClause(orgId, request)
    val orderByClause: String = buildOrderBy(request.sorts)
    val limitClause = s"limit ${request.size} offset ${request.from}"

    val query = s"$selectClause $whereClause $orderByClause $limitClause"
    client.executeQuery(query, conditionValues: _*)(toDirectories)
  }

  override def get(orgId: Long, id: DirectoryId): Future[Option[Directory]] =
    Future {
      client.executeQuery(
        s"""
           |select *
           |from $dbName.$tblName
           |where org_id = ? and id = ?;
           |""".stripMargin,
        orgId,
        id
      )(rs => {
        if (rs.next())
          Some(toDirectory(rs))
        else
          None
      })
    }

  override def delete(orgId: Long, id: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
           |delete from $dbName.$tblName
           |where org_id = ? and id = ?;
           |""".stripMargin
      client.executeUpdate(query, orgId, id) >= 1
    }

  private def buildWhereClause(orgId: Long, request: ListDirectoriesRequest): (String, Seq[Any]) = {
    val conditionValues = ArrayBuffer.empty[Any]
    var whereClause = "where org_id = ?"
    conditionValues += orgId

    request.parentId match {
      case Some(x) =>
        conditionValues += x
        whereClause += " && parent_id = ?"
      case None =>
    }

    request.isRemoved match {
      case Some(x) =>
        conditionValues += x
        whereClause += " && is_removed = ?"
      case None =>
    }

    request.dashboardId match {
      case Some(x) =>
        conditionValues += x
        whereClause += " && dashboard_id = ?"
      case None =>
    }

    request.ownerId match {
      case Some(x) =>
        conditionValues += x
        whereClause += " && owner_id = ?"
      case None =>
    }

    request.directoryType match {
      case Some(x) =>
        conditionValues += x.toString
        whereClause += " && dir_type = ?"
      case None =>
    }

    (whereClause, conditionValues)
  }

  private def buildOrderBy(sorts: Array[Sort]): String = {
    if (sorts.nonEmpty) {
      "order by " + sorts.map(sort => s"${sort.field} ${sort.order.toString}").mkString(", ")
    } else {
      ""
    }
  }

  private def toDirectories(rs: ResultSet): Array[Directory] = {
    val directories = ArrayBuffer[Directory]()
    while (rs.next()) directories += toDirectory(rs)
    directories.toArray
  }

  private def toDirectory(rs: ResultSet): Directory = {
    val orgId = rs.getLong("org_id")
    val id = rs.getLong("id")
    val name = rs.getString("name")
    val creatorId = rs.getString("creator_id")
    val ownerId = rs.getString("owner_id")
    val createdDate = rs.getLong("created_date")
    val parentId = rs.getLong("parent_id")
    val isRemoved = rs.getBoolean("is_removed")
    val dirType = rs.getString("dir_type")
    val dashboardIdTmp = rs.getLong("dashboard_id")
    val dashboardId = if (rs.wasNull()) None else Some(dashboardIdTmp)
    val updatedDate = rs.getLong("updated_date")
    Directory(
      orgId = orgId,
      id = id,
      name = name,
      creatorId = creatorId,
      ownerId = ownerId,
      createdDate = createdDate,
      parentId = parentId,
      isRemoved = isRemoved,
      directoryType = DirectoryType.withName(dirType),
      dashboardId = dashboardId,
      updatedDate = Option(updatedDate)
    )
  }

  override def isExist(orgId: Long, id: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
        |select *
        |from $dbName.$tblName
        |where org_id = ? and id = ?
        |""".stripMargin
      client.executeQuery(query, orgId, id)(rs => {
        if (rs.next())
          true
        else
          false
      })
    }

  override def getSubDirectories(orgId: Long, parentId: DirectoryId): Future[Array[Directory]] =
    Future {
      val dirIdQueue = mutable.Queue[DirectoryId](parentId)
      val allDirectories = ArrayBuffer[Directory]()
      while (dirIdQueue.nonEmpty) {
        val curDirId: DirectoryId = dirIdQueue.dequeue()
        val directories = listSync(orgId, ListDirectoriesRequest(parentId = Some(curDirId), size = Int.MaxValue))
        allDirectories.appendAll(directories)
        directories.foreach { directory =>
          dirIdQueue.enqueue(directory.id)
        }
      }
      allDirectories.toArray
    }

  override def multiDelete(orgId: Long, ids: Seq[DirectoryId]): Future[Boolean] =
    Future {
      if (ids.isEmpty) {
        true
      } else {
        val args = Seq(orgId) ++ ids
        val query =
          s"""
             |delete from $dbName.$tblName
             |where org_id = ? and id in (${ids.map(_ => "?").mkString(",")})
             |""".stripMargin
        client.executeUpdate(query, args: _*) >= 1
      }
    }

  override def deleteByOwnerId(orgId: Long, ownerId: String): Future[Boolean] =
    Future {
      val query =
        s"""
         |delete from $dbName.$tblName
         |where org_id = ? and owner_id = ?;
         |""".stripMargin
      client.executeUpdate(query, orgId, ownerId) >= 1
    }
}
