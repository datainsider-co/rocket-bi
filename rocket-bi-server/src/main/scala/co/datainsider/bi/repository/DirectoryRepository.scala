package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Ids.{DashboardId, DirectoryId, UserId}
import co.datainsider.bi.domain.request.{CreateDirectoryRequest, ListDirectoriesRequest, Sort}
import co.datainsider.bi.domain.{Directory, DirectoryType}
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future
import datainsider.client.util.JsonParser

import java.sql.ResultSet
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

trait DirectoryRepository {
  def get(orgId: Long, id: DirectoryId): Future[Option[Directory]]

  def create(orgId: Long, request: CreateDirectoryRequest, ownerId: UserId, creatorId: UserId): Future[DirectoryId]

  def list(orgId: Long, request: ListDirectoriesRequest): Future[Array[Directory]]

  def list(orgId: Long, directoryIds: Array[DirectoryId]): Future[Array[Directory]]

  def count(orgId: Long, request: ListDirectoriesRequest): Future[Long]

  def listByDashboardIds(orgId: Long, dashboardIds: Array[DashboardId]): Future[Array[Directory]]

  def rename(orgId: Long, id: DirectoryId, toName: String): Future[Boolean]

  def move(orgId: Long, id: DirectoryId, toParentId: DirectoryId): Future[Boolean]

  def delete(orgId: Long, id: DirectoryId): Future[Boolean]

  def multiDelete(orgId: Long, ids: Array[DirectoryId]): Future[Boolean]
  def deleteByOwnerId(orgId: Long, username: UserId): Future[Boolean]

  def remove(orgId: Long, id: DirectoryId): Future[Boolean]

  def restore(orgId: Long, directory: Directory): Future[Boolean]

  def multiRestore(orgId: Long, directories: Seq[Directory]): Future[Boolean]

  def refreshUpdatedDate(ids: Array[DirectoryId]): Future[Boolean]

  def update(orgId: Long, directory: Directory): Future[Boolean]

  def updateOwnerId(orgId: Long, fromUsername: UserId, toUsername: UserId): Future[Boolean]

  def updateCreatorId(orgId: Long, fromUsername: UserId, toUsername: UserId): Future[Boolean]

  def listSubDirectories(orgId: Long, parentId: DirectoryId): Future[Array[Directory]]

}

class MySqlDirectoryRepository @Inject() (
    @Named("mysql") client: JdbcClient,
    dbName: String,
    tblName: String
) extends DirectoryRepository {

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
        else None
      })
    }

  override def create(
      orgId: Long,
      request: CreateDirectoryRequest,
      ownerId: UserId,
      creatorId: UserId
  ): Future[DirectoryId] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblName
         |(org_id, name, creator_id, owner_id, parent_id, dir_type, dashboard_id, updated_date, data)
         |values(?, ?, ?, ?, ?, ?, ?, ?, ?);
         |""".stripMargin

      client.executeInsert(
        query,
        orgId,
        request.name,
        creatorId,
        ownerId,
        request.parentId,
        request.directoryType.toString,
        request.dashboardId.orNull,
        System.currentTimeMillis(),
        request.data.map(JsonParser.toJson(_, false)).orNull
      )
    }

  override def list(orgId: Long, request: ListDirectoriesRequest): Future[Array[Directory]] =
    Future.value(listSync(orgId, request))

  private def listSync(orgId: Long, request: ListDirectoriesRequest): Array[Directory] = {
    val selectClause = s"select * from $dbName.$tblName"
    val (whereClause, conditionValues): (String, Seq[Any]) = buildWhereClause(orgId, request)
    val orderByClause: String = buildOrderBy(request.sorts)
    val limitClause = s"limit ${request.size} offset ${request.from}"

    val query = s"$selectClause $whereClause $orderByClause $limitClause"
    client.executeQuery(query, conditionValues: _*)(toDirectories)
  }

  override def count(orgId: Long, request: ListDirectoriesRequest): Future[DashboardId] =
    Future {
      val countClause = s"select count(*) from $dbName.$tblName"
      val (whereClause, conditionValues): (String, Seq[Any]) = buildWhereClause(orgId, request)
      val countQuery = s"$countClause $whereClause"
      client.executeQuery(countQuery, conditionValues: _*)(rs => if (rs.next()) rs.getLong(1) else 0)
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

    if (request.dashboardIds.nonEmpty) {
      whereClause += s" && dashboard_id in (${Seq.fill(request.dashboardIds.length)("?").mkString(", ")})"
      conditionValues ++= request.dashboardIds
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

  override def list(orgId: Long, directoryIds: Array[DirectoryId]): Future[Array[Directory]] =
    Future {
      if (directoryIds.isEmpty) {
        Array.empty
      } else {
        val args = Array(orgId) ++ directoryIds
        val query =
          s"""
             |select * from $dbName.$tblName 
             |where org_id = ? and is_removed = false 
             |  and id in (${Array.fill(directoryIds.length)("?").mkString(",")})
             |""".stripMargin

        client.executeQuery(query, args: _*)(toDirectories)
      }
    }

  override def rename(orgId: Long, id: DirectoryId, toName: String): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblName
         |set name = ?, updated_date = ?
         |where org_id = ? and id = ?;
         |""".stripMargin,
        toName,
        System.currentTimeMillis(),
        orgId,
        id
      ) >= 1
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

  override def multiDelete(orgId: Long, ids: Array[DirectoryId]): Future[Boolean] =
    Future {
      if (ids.isEmpty) {
        true
      } else {
        val args = Array(orgId) ++ ids
        val query =
          s"""
           |delete from $dbName.$tblName
           |where org_id = ? and id in (${Array.fill(ids.length)("?").mkString(",")});
           |""".stripMargin

        client.executeUpdate(query, args: _*) >= 1
      }
    }

  override def deleteByOwnerId(orgId: Long, username: UserId): Future[Boolean] =
    Future {
      val query =
        s"""
             |delete from $dbName.$tblName
             |where org_id = ? and owner_id = ?;
             |""".stripMargin
      client.executeUpdate(query, orgId, username) >= 1
    }

  override def move(orgId: Long, id: DirectoryId, toParentId: DirectoryId): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblName
         |set parent_id = ?
         |where org_id = ? and id = ?;
         |""".stripMargin,
        toParentId,
        orgId,
        id
      ) >= 1
    }

  override def remove(orgId: Long, id: DirectoryId): Future[Boolean] =
    Future {
      client.executeUpdate(s"""
         |update $dbName.$tblName
         |set is_removed = ?
         |where org_id = ? and id = ?;
         |""".stripMargin, true, orgId, id) >= 1
    }

  override def restore(orgId: Long, directory: Directory): Future[Boolean] =
    Future {
      val query =
        s"""
           |insert into $dbName.$tblName
           |(org_id, id, name, creator_id, owner_id, created_date, parent_id, dir_type, dashboard_id, updated_date, data)
           |values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
           |""".stripMargin

      client.executeUpdate(
        query,
        orgId,
        directory.id,
        directory.name,
        directory.creatorId,
        directory.ownerId,
        directory.createdDate,
        directory.parentId,
        directory.directoryType.toString,
        directory.dashboardId.orNull,
        System.currentTimeMillis(),
        directory.data.map(JsonParser.toJson(_, false)).orNull
      ) > 0
    }

  override def multiRestore(orgId: Long, directories: Seq[Directory]): Future[Boolean] =
    Future {
      if (directories.isEmpty) {
        true
      } else {
        val query =
          s"""
           |insert into $dbName.$tblName
           |(org_id, id, name, creator_id, owner_id, created_date, parent_id, dir_type, dashboard_id, updated_date, data)
           |values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
            directory.data.map(JsonParser.toJson(_, false)).orNull
          )
        }.toArray

        client.executeBatchUpdate(query, data) > 0
      }
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
    val dataAsJson: Option[String] = Option(rs.getString("data"))
    val data: Option[Map[String, Any]] = dataAsJson.map(JsonParser.fromJson[Map[String, Any]](_))
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
      updatedDate = Some(updatedDate),
      data = data
    )
  }

  private def toDirectories(rs: ResultSet): Array[Directory] = {
    val directories = ArrayBuffer[Directory]()
    while (rs.next()) directories += toDirectory(rs)
    directories.toArray
  }

  override def listByDashboardIds(orgId: Long, dashboardIds: Array[DashboardId]): Future[Array[Directory]] =
    Future {
      if (dashboardIds.isEmpty) {
        Array.empty
      } else {
        val args = Array(orgId) ++ dashboardIds
        client.executeQuery(
          s"""
          |select *
          |from $dbName.$tblName
          |where org_id = ? and is_removed = false 
          |  and dashboard_id in (${Array.fill(dashboardIds.length)("?").mkString(",")})
          |""".stripMargin,
          args: _*
        )(toDirectories)
      }
    }

  override def refreshUpdatedDate(ids: Array[DirectoryId]): Future[Boolean] =
    Future {
      val data: Array[Array[Any]] = ids.map(id => {
        Array(System.currentTimeMillis(), id): Array[Any]
      })
      client.executeBatchUpdate(
        s"""
        |update $dbName.$tblName
        |set updated_date = ?
        |where id = ?
        |""".stripMargin,
        data
      ) >= 1
    }

  override def update(orgId: Long, directory: Directory): Future[Boolean] =
    Future {
      val query =
        s"""
         |UPDATE $dbName.$tblName
         |SET data = ?, updated_date = ?
         |WHERE org_id = ? and id = ?
         |""".stripMargin

      client.executeUpdate(
        query,
        directory.data.map(JsonParser.toJson(_, false)).orNull,
        directory.updatedDate.getOrElse(System.currentTimeMillis()),
        orgId,
        directory.id
      ) > 0
    }

  override def updateOwnerId(orgId: Long, fromUsername: UserId, toUsername: UserId): Future[Boolean] =
    Future {
      val query =
        s"""
        |UPDATE ${dbName}.${tblName}
        |SET owner_id = ?
        |WHERE org_id = ? and owner_id = ?
        |""".stripMargin
      client.executeUpdate(query, toUsername, orgId, fromUsername) > 0
    }

  override def updateCreatorId(orgId: Long, fromUsername: UserId, toUsername: UserId): Future[Boolean] =
    Future {
      val query =
        s"""
        |UPDATE ${dbName}.${tblName}
        |SET creator_id = ?
        |WHERE org_id = ? and creator_id = ?
        |""".stripMargin
      client.executeUpdate(query, toUsername, orgId, fromUsername) > 0
    }

  override def listSubDirectories(orgId: Long, parentId: DirectoryId): Future[Array[Directory]] =
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

}
