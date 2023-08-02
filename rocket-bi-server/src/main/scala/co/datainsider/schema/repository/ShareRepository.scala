package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.schema.domain.{PageResult, SharingInfo}
import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import education.x.commons.IDGenerator

import java.sql.ResultSet
import java.util.UUID
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

trait ShareRepository {
  def getSharingInfos(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      from: Int,
      size: Int
  ): Future[PageResult[SharingInfo]]

  def getSharingInfos(shareIds: Seq[String]): Future[Seq[SharingInfo]]

  def getResourceIds(
      organizationId: Long,
      resourceType: String,
      username: String,
      from: Int,
      size: Int
  ): Future[PageResult[String]]

  def softDelete(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Boolean]

  def shareWithUsers(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String],
      creator: String
  ): Future[Boolean]

  def updateUpdatedTimeShareInfo(shareIds: Seq[String]): Future[Boolean]

  def isShared(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Map[String, Boolean]]

  def isShared(
      organizationId: Long,
      resourceType: String,
      resourceIds: Seq[String],
      username: String
  ): Future[Map[String, Boolean]]

  def delete(id: String): Future[Boolean]
}

object ObjectShareRepository {
  implicit class EnhanceImplicitResultSet(val rs: ResultSet) extends AnyVal {
    def readAsTotalId(): Long = {
      rs.next match {
        case true => rs.getLong("total")
        case _    => 0
      }
    }

    def asShareInfo(): SharingInfo = {
      SharingInfo(
        id = rs.getString("id"),
        username = rs.getString("username"),
        resourceType = rs.getString("resource_type"),
        resourceId = rs.getString("resource_id"),
        createdAt = Some(rs.getLong("created_at")),
        updatedAt = Some(rs.getLong("updated_at")),
        createdBy = Some(rs.getString("created_by"))
      )
    }

    def readAsSharingInfo(): Seq[SharingInfo] = {
      val infos = ArrayBuffer[SharingInfo]()
      while (rs.next()) {
        infos += asShareInfo()
      }
      infos.toSeq
    }

    def readAsListString(key: String): Seq[String] = {
      val ids = ArrayBuffer[String]()
      while (rs.next()) {
        ids += rs.getString(key)
      }
      ids.toSeq
    }
  }

}

case class MySqlShareRepository(client: JdbcClient, dbName: String, tblName: String, generator: IDGenerator[Int])
    extends ShareRepository {
  import ObjectShareRepository.EnhanceImplicitResultSet

  private def getTable: String = {
    s"$dbName.$tblName"
  }

  private def countUserSharing(organizationId: Long, resourceType: String, resourceId: String): Long = {
    client.executeQuery[Long](
      s"""
         |SELECT COUNT(DISTINCT(username)) as total
         |FROM ${getTable}
         |WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND resource_id = ?
         |""".stripMargin,
      organizationId,
      resourceType,
      resourceId
    )(_.readAsTotalId())
  }

  override def getSharingInfos(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      from: Int,
      size: Int
  ): Future[PageResult[SharingInfo]] = {
    val total: Long = countUserSharing(organizationId, resourceType, resourceId)
    val data: Seq[SharingInfo] = client
      .executeQuery[Seq[SharingInfo]](
        s"""
           |SELECT id, organization_id, resource_type, resource_id, username, created_at, updated_at, created_by
           |FROM ${getTable}
           |WHERE is_deleted = FALSE AND organization_id = ? AND 	resource_type = ? AND resource_id  = ?
           |ORDER BY created_at DESC
           |LIMIT ?, ?
           |""".stripMargin,
        organizationId,
        resourceType,
        resourceId,
        from,
        size
      )(_.readAsSharingInfo())
      .groupBy(_.username)
      .map(_._2.maxBy(_.createdAt.getOrElse(0L)))
      .toSeq
    Future.value(PageResult(total = total, data = data))
  }

  private def countResourceSharingByUser(organizationId: Long, resourceType: String, username: String): Long = {
    client.executeQuery[Long](
      s"""
         |SELECT COUNT(id) as total
         |FROM ${getTable}
         |WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND username = ?
         |""".stripMargin,
      organizationId,
      resourceType,
      username
    )(_.readAsTotalId())
  }

  override def getResourceIds(
      organizationId: Long,
      resourceType: String,
      username: String,
      from: Int,
      size: Int
  ): Future[PageResult[String]] = {
    val total: Long = countResourceSharingByUser(organizationId, resourceType, username)
    val data: Seq[String] = client.executeQuery[Seq[String]](
      s"""
         |SELECT resource_id
         |FROM ${getTable}
         |WHERE is_deleted = FALSE AND organization_id = ? AND 	resource_type = ? AND username  = ?
         |ORDER BY created_at DESC
         |LIMIT ?, ?
         |""".stripMargin,
      organizationId,
      resourceType,
      username,
      from,
      size
    )(_.readAsListString("resource_id"))
    Future.value(PageResult(total = total, data = data))
  }

  override def softDelete(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Boolean] = {
    val data: Array[Record] = usernames
      .map(Array(System.currentTimeMillis(), organizationId, resourceType, resourceId, _))
      .toArray
    val r: Boolean = client.executeBatchUpdate(
      s"""
         |UPDATE ${getTable}
         |SET is_deleted = TRUE, updated_at = ?
         |WHERE organization_id = ? AND 	resource_type = ? AND resource_id  = ? AND  username  = ?
         |""".stripMargin,
      data
    ) >= 0
    Future.value(r)
  }

  def generateId(): Future[String] = {
    generator.getNextId().asTwitter.map {
      case Some(id) => s"s_$id"
      case _        => s"r_${UUID.randomUUID().toString}"
    }
  }

  def createInsertShareInfoData(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String],
      creator: String
  ): Future[Array[Record]] = {
    val fn: Seq[Future[Array[Any]]] = usernames.map(username => {
      generateId().map(id => {
        Array(
          id,
          organizationId,
          resourceType,
          resourceId,
          username,
          System.currentTimeMillis(),
          System.currentTimeMillis(),
          creator,
          false
        )
      })
    })
    Future.collect(fn).map(_.toArray)
  }

  override def shareWithUsers(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String],
      creator: String
  ): Future[Boolean] = {
    for {
      insertData <- createInsertShareInfoData(organizationId, resourceType, resourceId, usernames, creator)
      success = client.executeBatchUpdate(
        s"""
           |INSERT INTO $getTable(id, organization_id, resource_type, resource_id, username, created_at, updated_at, created_by, is_deleted)
           |VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
           |""".stripMargin,
        insertData
      ) > 0
    } yield success
  }

  override def updateUpdatedTimeShareInfo(shareIds: Seq[String]): Future[Boolean] = {
    val shareData: Array[Array[Any]] = shareIds.toArray.map(shareId => Array(System.currentTimeMillis(), shareId))
    val r: Boolean = client.executeBatchUpdate(
      s"""
         |UPDATE ${getTable}
         |SET updated_at = ?
         |WHERE id = ?
         |""".stripMargin,
      shareData
    ) >= 0
    Future.value(r)
  }

  override def getSharingInfos(shareIds: Seq[String]): Future[Seq[SharingInfo]] =
    Future {
      println(getTable)
      if (shareIds.isEmpty) {
        Seq.empty
      } else {
        client.executeQuery[Seq[SharingInfo]](
          s"""
             |SELECT id, organization_id, resource_type, resource_id, username, created_at, updated_at, created_by
             |FROM ${getTable}
             |WHERE is_deleted = FALSE AND id in (${createParams(shareIds.size)})
             |""".stripMargin,
          shareIds.toArray: _*
        )(_.readAsSharingInfo())
      }
    }

  private def createParams(size: Int) = {
    Array.fill(size)("?").mkString(",")
  }

  override def isShared(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Map[String, Boolean]] =
    Future {
      val params: Seq[Any] = Seq(organizationId, resourceType, resourceId) ++ usernames
      val usernamesExisted: Set[String] = client
        .executeQuery(
          s"""
             |SELECT DISTINCT (username)
             |FROM ${getTable}
             |WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND resource_id = ? AND username IN (${createParams(
            usernames.size
          )})
             |""".stripMargin,
          params: _*
        )(_.readAsListString("username"))
        .toSet
      val usernamesNotExisted: Set[String] = usernames.toSet.diff(usernamesExisted)
      (usernamesNotExisted.map(_ -> false) ++ usernamesExisted.map(_ -> true)).toMap
    }

  override def isShared(
      organizationId: Long,
      resourceType: String,
      resourceIds: Seq[String],
      username: String
  ): Future[Map[String, Boolean]] =
    Future {
      val params: Seq[Any] = Seq(organizationId, resourceType, username) ++ resourceIds
      val resourceIdsExisted: Set[String] = client
        .executeQuery(
          s"""
             |SELECT DISTINCT (resource_id)
             |FROM ${getTable}
             |WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND username = ? AND resource_id IN (${createParams(
            resourceIds.size
          )})
             |""".stripMargin,
          params: _*
        )(_.readAsListString("resource_id"))
        .toSet
      val resourceIdsNotExisted: Set[String] = resourceIds.toSet.diff(resourceIdsExisted)
      (resourceIdsNotExisted.map(_ -> false) ++ resourceIdsExisted.map(_ -> true)).toMap
    }

  override def delete(id: String): Future[Boolean] =
    Future {
      client.executeUpdate(s"""
        |DELETE FROM ${getTable} WHERE id = '$id'
        |""".stripMargin) > 0
    }
}
