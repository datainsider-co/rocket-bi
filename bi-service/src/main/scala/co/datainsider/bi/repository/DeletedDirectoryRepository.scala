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
  def insert(directory: Directory): Future[Boolean]

  def multiInsert(directories: Seq[Directory]): Future[Boolean]

  def list(request: ListDirectoriesRequest): Future[Array[Directory]]

  def get(id: DirectoryId): Future[Option[Directory]]

  def delete(id: DirectoryId): Future[Boolean]

  def multiDelete(ids: Seq[DirectoryId]): Future[Boolean]

  def deleteByOwnerId(username: String): Future[Boolean]

  def isExist(id: DirectoryId): Future[Boolean]

  /**
   * get all sub directories of a directory
   */
  def getSubDirectories(parentId: DirectoryId): Future[Array[Directory]]
}

class MysqlDeletedDirectoryRepository @Inject() (
    @Named("mysql") client: JdbcClient,
    dbName: String,
    tblName: String
) extends DeletedDirectoryRepository {

  override def insert(directory: Directory): Future[Boolean] = {
    Future {
      val query =
        s"""
           |insert into $dbName.$tblName
           |(id, name, creator_id, owner_id, created_date, parent_id, dir_type, dashboard_id, deleted_date, updated_date)
           |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           |""".stripMargin

      client.executeUpdate(
        query,
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

  override def multiInsert(directories: Seq[Directory]): Future[Boolean] = {
    Future {
      val query =
        s"""
           |insert into $dbName.$tblName
           |(id, name, creator_id, owner_id, created_date, parent_id, dir_type, dashboard_id, deleted_date, updated_date)
           |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           |""".stripMargin
      val data: Array[Record] = directories.map { directory =>
        Array(
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

  override def list(request: ListDirectoriesRequest): Future[Array[Directory]] =  {
    Future.value(listSync(request))
  }

  private def listSync(request: ListDirectoriesRequest): Array[Directory] = {
    val selectClause = s"select * from $dbName.$tblName"
    val (whereClause, conditionValues): (String, Seq[Any]) = buildWhereClause(request)
    val orderByClause: String = buildOrderBy(request.sorts)
    val limitClause = s"limit ${request.size} offset ${request.from}"

    val query = s"$selectClause $whereClause $orderByClause $limitClause"
    client.executeQuery(query, conditionValues: _*)(toDirectories)
  }

  override def get(id: DirectoryId): Future[Option[Directory]] =
    Future {
      client.executeQuery(
        s"""
           |select *
           |from $dbName.$tblName
           |where id = ?;
           |""".stripMargin,
        id
      )(rs => {
        if (rs.next())
          Some(toDirectory(rs))
        else
          None
      })
    }

  override def delete(id: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
           |delete from $dbName.$tblName
           |where id = ?;
           |""".stripMargin
      client.executeUpdate(query, id) >= 1
    }

  private def buildWhereClause(request: ListDirectoriesRequest): (String, Seq[Any]) = {
    val conditionValues = ArrayBuffer.empty[Any]
    var whereClause = "where 1=1"

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
      id,
      name,
      creatorId,
      ownerId,
      createdDate,
      parentId,
      isRemoved,
      DirectoryType.withName(dirType),
      dashboardId,
      Option(updatedDate)
    )
  }

  override def isExist(id: DirectoryId): Future[Boolean] =
    Future {
      val query =
        s"""
        |select *
        |from $dbName.$tblName
        |where id = ?
        |""".stripMargin
      client.executeQuery(query, id)(rs => {
        if (rs.next())
          true
        else
          false
      })
    }

  override def getSubDirectories(parentId: DirectoryId): Future[Array[Directory]] = Future {
    val dirIdQueue = mutable.Queue[DirectoryId](parentId)
    val allDirectories = ArrayBuffer[Directory]()
    while (dirIdQueue.nonEmpty) {
      val curDirId: DirectoryId = dirIdQueue.dequeue()
      val directories = listSync(ListDirectoriesRequest(parentId = Some(curDirId), size = Int.MaxValue))
      allDirectories.appendAll(directories)
      directories.foreach { directory =>
        dirIdQueue.enqueue(directory.id)
      }
    }
    allDirectories.toArray
  }

  override def multiDelete(ids: Seq[DirectoryId]): Future[Boolean] = Future {
      if (ids.isEmpty) {
        true
      } else {
        val query =
          s"""
             |delete from $dbName.$tblName
             |where id in (${ids.map(_ => "?").mkString(",")})
             |""".stripMargin
        client.executeUpdate(query, ids: _*) >= 1
      }
    }

  override def deleteByOwnerId(ownerId: String): Future[Boolean] = Future {
    val query =
      s"""
         |delete from $dbName.$tblName
         |where owner_id = ?;
         |""".stripMargin
    client.executeUpdate(query, ownerId) >= 1
  }
}
