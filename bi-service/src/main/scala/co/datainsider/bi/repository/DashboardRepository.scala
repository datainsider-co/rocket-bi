package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Ids.{DashboardId, OrganizationId, UserId, WidgetId}
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.chart.Widget
import co.datainsider.bi.domain.query.Field
import co.datainsider.bi.domain.request.ListDrillThroughDashboardRequest
import co.datainsider.bi.util.Serializer
import co.datainsider.share.domain.response.PageResult
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.Logging
import com.twitter.util.{Await, Future}

import java.sql.ResultSet
import scala.collection.mutable.{ArrayBuffer, ListBuffer}

trait DashboardRepository {
  def list(from: Int, size: Int): Future[Seq[Dashboard]]

  def count(): Future[Long]

  def create(dashboard: Dashboard): Future[DashboardId]

  def get(id: DashboardId): Future[Option[Dashboard]]

  def rename(id: DashboardId, toName: String): Future[Boolean]

  @deprecated("use update instead")
  def updateMainDateFilter(id: DashboardId, mainDateFilter: Option[MainDateFilter]): Future[Boolean]

  def updateWidgets(
      id: DashboardId,
      widgets: Option[Array[Widget]],
      positions: Option[Map[WidgetId, Position]]
  ): Future[Boolean]

  def delete(id: DashboardId): Future[Boolean]

  def multiDelete(ids: Array[DashboardId]): Future[Boolean]
//  def deleteByOwnerId(ownerId: UserId): Future[Boolean]

  def update(id: DashboardId, dashboard: Dashboard): Future[Boolean]

  def listDashboards(request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]]

  // scan all database
  // method for migrate
  def scan(chunkSize: Int)(fn: Seq[Dashboard] => Future[Unit]): Future[Unit]

  def updateOwnerId(fromUsername: UserId, toUsername: UserId): Future[Boolean]
  def updateCreatorId(fromUsername: UserId, toUsername: UserId): Future[Boolean]
}

class MySqlDashboardRepository(
    client: JdbcClient,
    dbName: String,
    tblDashboardName: String,
    tblDirectoryName: String,
    tblShareInfoName: String,
    tblDrillThroughFieldName: String
) extends DashboardRepository
    with Logging {

  override def list(from: Int, size: Int): Future[Seq[Dashboard]] =
    Future {
      val query = s"select * from $dbName.$tblDashboardName limit ? offset ?"
      client.executeQuery(query, size, from)(toDashboards)
    }

  override def count(): Future[DashboardId] =
    Future {
      client.executeQuery(s"select count(1) from $dbName.$tblDashboardName")(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else 0L
      })
    }

  override def get(id: DashboardId): Future[Option[Dashboard]] =
    Future {
      client.executeQuery(s"""
         |select *
         |from $dbName.$tblDashboardName
         |where id = ?;
         |""".stripMargin, id)(rs => {
        if (rs.next()) {
          Some(toDashboard(rs))
        } else {
          None
        }
      })
    }

  override def create(dashboard: Dashboard): Future[DashboardId] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblDashboardName
         |(name, creator_id, owner_id, widgets, widget_positions, main_date_filter, boost_info, setting)
         |values(?, ?, ?, ?, ?, ?, ?, ?);
         |""".stripMargin

      client.executeInsert(
        query,
        dashboard.name,
        dashboard.creatorId,
        dashboard.ownerId,
        Serializer.toJson(dashboard.widgets),
        Serializer.toJson(dashboard.widgetPositions),
        Serializer.toJson(dashboard.mainDateFilter),
        Serializer.toJson(dashboard.boostInfo),
        Serializer.toJson(dashboard.setting)
      )
    }

  override def rename(id: DashboardId, newName: String): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
          |update $dbName.$tblDashboardName
          |set name = ?
          |where id = ?;
          |""".stripMargin,
        newName,
        id
      ) >= 1
    }

  override def updateMainDateFilter(id: DashboardId, mainDateFilter: Option[MainDateFilter]): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblDashboardName
         |set main_date_filter = ?
         |where id = ?
         |""".stripMargin,
        Serializer.toJson(mainDateFilter),
        id
      ) >= 1
    }

  override def delete(id: DashboardId): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |delete from $dbName.$tblDashboardName
         |where id = ?;
         |""".stripMargin,
        id
      ) >= 1
    }

  override def updateWidgets(
      id: DashboardId,
      widgets: Option[Array[Widget]],
      positions: Option[Map[WidgetId, Position]]
  ): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblDashboardName
         |set widgets = ?, widget_positions = ?
         |where id = ?;
         |""".stripMargin,
        Serializer.toJson(widgets),
        Serializer.toJson(positions),
        id
      ) >= 1
    }

  override def update(id: DashboardId, dashboard: Dashboard): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblDashboardName
         |set name = ?, main_date_filter = ?, boost_info = ?, setting = ?
         |where id = ?;
         |""".stripMargin,
        dashboard.name,
        Serializer.toJson(dashboard.mainDateFilter),
        Serializer.toJson(dashboard.boostInfo),
        Serializer.toJson(dashboard.setting),
        id
      ) >= 1
    }

  private def toDashboard(rs: ResultSet): Dashboard = {
    val id = rs.getLong("id")
    val name = rs.getString("name")
    val creatorId = rs.getString("creator_id")
    val ownerId = rs.getString("owner_id")

    // for migration purpose only, TODO: remove in later version
    val widgetsJson = rs.getString("widgets")
    val updatedWidgetsJson = widgetsJson
      .replace(
        """{"alias_name":"adhoc_view",""",
        """{"class_name":"sql_view","alias_name":"adhoc_view","""
      )
      .replace(
        """{"alias_name":"view_""",
        """{"class_name":"sql_view","alias_name":"view_"""
      )

    val widgets = Serializer.fromJson[Array[Widget]](updatedWidgetsJson)
    val widgetPositions = Serializer.fromJson[Map[WidgetId, Position]](rs.getString("widget_positions"))
    val mainDateFilter = Serializer.fromJson[Option[MainDateFilter]](rs.getString("main_date_filter"))
    val boostInfo = Serializer.fromJson[Option[BoostInfo]](rs.getString("boost_info"))
    val setting = Serializer.fromJson[Option[JsonNode]](rs.getString("setting"))

    Dashboard(
      id = id,
      name = name,
      creatorId = creatorId,
      ownerId = ownerId,
      widgets = Some(widgets),
      widgetPositions = Some(widgetPositions),
      mainDateFilter = mainDateFilter,
      boostInfo = boostInfo,
      setting = setting
    )
  }

  override def listDashboards(request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]] =
    Future {
      PageResult(
        total = countTotalDrillThroughDashboards(request),
        data = getDrillThroughDashboards(request)
      )
    }

  private def toDashboards(rs: ResultSet): Seq[Dashboard] = {
    val tableFields = ListBuffer[Dashboard]()
    while (rs.next()) tableFields += toDashboard(rs)
    tableFields
  }

  private def getDrillThroughDashboards(request: ListDrillThroughDashboardRequest): Seq[Dashboard] = {
    val queryData = prepareListDrillThroughDashboards(request)
    client.executeQuery(querySelectDrillThroughDashboard(request), queryData: _*)(toDashboards)
  }

  private def countTotalDrillThroughDashboards(request: ListDrillThroughDashboardRequest): Long = {
    val queryData = prepareCountDrillThroughDashboards(request)
    client.executeQuery(queryCountDrillThroughDashboard(request), queryData: _*)(rs =>
      if (rs.next()) rs.getLong(1) else 0
    )
  }

  private def querySelectDrillThroughDashboard(request: ListDrillThroughDashboardRequest): String = {
    s"""
       |SELECT dashboard.*
       |FROM $dbName.$tblDashboardName dashboard
       |INNER JOIN $dbName.$tblDirectoryName directory on dashboard.id = directory.dashboard_id
       |LEFT JOIN $dbName.$tblShareInfoName share_info on share_info.resource_id = directory.id
       |RIGHT JOIN (${queryDrillThroughDashboardId(request.fields)}) drill_field on dashboard.id = drill_field.dashboard_id
       |${buildWhereDrillThroughCause(request)}
       |ORDER BY dashboard.name ASC
       |LIMIT ?, ?""".stripMargin
  }

  private def queryCountDrillThroughDashboard(request: ListDrillThroughDashboardRequest): String = {
    s"""
       |SELECT COUNT(dashboard.id)
       |FROM $dbName.$tblDashboardName dashboard
       |INNER JOIN $dbName.$tblDirectoryName directory on dashboard.id = directory.dashboard_id
       |LEFT JOIN $dbName.$tblShareInfoName share_info on share_info.resource_id = directory.id
       |RIGHT JOIN (${queryDrillThroughDashboardId(request.fields)}) drill_field on dashboard.id = drill_field.dashboard_id
       | ${buildWhereDrillThroughCause(request)}
       | """.stripMargin
  }

  private def queryDrillThroughDashboardId(fields: Array[Field]): String = {
    s"""
       |SELECT DISTINCT dashboard_id
       |FROM $dbName.$tblDrillThroughFieldName
       |WHERE
       |${if (fields.nonEmpty) s"field_id in (${createParams(fields.length)})" else " FALSE"}
       |""".stripMargin
  }

  private def buildWhereDrillThroughCause(request: ListDrillThroughDashboardRequest) = {
    val finalWhereCause: StringBuilder = new StringBuilder()
    val basicWhere =
      s"""
         |WHERE
         |	directory.is_removed = ?
         |	and (share_info.is_deleted = FALSE or share_info.is_deleted is NULL)
         |	and
         |	(
         |		dashboard.owner_id = ?
         |		or share_info.username = ?
         |	)
         |""".stripMargin

    finalWhereCause.append(basicWhere)

    if (request.excludeIds.nonEmpty) {
      finalWhereCause.append(s" and dashboard.id not in (${createParams(request.excludeIds.length)})")
    }

    finalWhereCause.toString()
  }

  private def prepareListDrillThroughDashboards(request: ListDrillThroughDashboardRequest): Record = {
    val params = ArrayBuffer.empty[Any]
    val fieldIds: Seq[String] = request.fields.map(field => field.normalizedFieldName)
    params.appendAll(fieldIds)
    params.append(
      request.isRemoved.getOrElse(false),
      request.currentUsername,
      request.currentUsername
    )
    params.appendAll(request.excludeIds)

    params.append(
      request.from,
      request.size
    )

    params.toArray
  }

  private def prepareCountDrillThroughDashboards(request: ListDrillThroughDashboardRequest): Record = {
    val params = ArrayBuffer.empty[Any]
    val fieldIds: Seq[String] = request.fields.map(field => field.normalizedFieldName)
    params.appendAll(fieldIds)

    params.append(
      request.isRemoved.getOrElse(false),
      request.currentUsername,
      request.currentUsername
    )
    params.appendAll(request.excludeIds)
    params.toArray
  }

  private def createParams(size: Int): String = {
    Array.fill(size)("?").mkString(",")
  }

  override def scan(chunkSize: Int)(fn: Seq[Dashboard] => Future[Unit]): Future[Unit] =
    Future {
      val query = s"select * from $dbName.$tblDashboardName"
      client.executeQuery(query)(converter = rs => {
        var buffer = ArrayBuffer[Dashboard]()
        var size = 0
        while (rs.next()) {
          try {
            buffer.append(toDashboard(rs))
            size += 1
            if (buffer.size > chunkSize) {
              Await.result(fn(buffer))
              buffer = ArrayBuffer()
            }
          } catch {
            case ex: Throwable => logger.error(s"scan failed at id: ${rs.getLong("id")} error: ${ex.getMessage}")
          }
        }
        logger.info(s"scan completed:: size ${size}")
        // end buffer
        if (buffer.nonEmpty) {
          Await.result(fn(buffer))
        }
      })
    }

  override def updateOwnerId(
      fromUsername: UserId,
      toUsername: UserId
  ): Future[Boolean] =
    Future {
      val query = s"update $dbName.$tblDashboardName set owner_id = ? where owner_id = ?"
      client.executeUpdate(query, toUsername, fromUsername) > 0
    }

  override def updateCreatorId(
      fromUsername: UserId,
      toUsername: UserId
  ): Future[Boolean] = Future {
      val query = s"update $dbName.$tblDashboardName set creator_id = ? where creator_id = ?"
      client.executeUpdate(query, toUsername, fromUsername) > 0
    }

  override def multiDelete(ids: Array[DashboardId]): Future[Boolean] = Future {
    if (ids.isEmpty) {
      true
    } else {
      val query = s"delete from $dbName.$tblDashboardName where id in (${createParams(ids.length)})"
      client.executeUpdate(query, ids: _*) > 0
    }
  }
}
