package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Ids.{DashboardId, UserId, WidgetId}
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
  def list(orgId: Long, from: Int, size: Int, useAsTemplate: Option[Boolean] = None): Future[Seq[Dashboard]]

  def count(orgId: Long, useAsTemplate: Option[Boolean] = None): Future[Long]

  def create(orgId: Long, dashboard: Dashboard): Future[DashboardId]

  def get(orgId: Long, id: DashboardId): Future[Option[Dashboard]]

  def rename(orgId: Long, id: DashboardId, toName: String): Future[Boolean]

  @deprecated("use update instead")
  def updateMainDateFilter(orgId: Long, id: DashboardId, mainDateFilter: Option[MainDateFilter]): Future[Boolean]

  def updateWidgets(
      orgId: Long,
      id: DashboardId,
      widgets: Option[Array[Widget]],
      positions: Option[Map[WidgetId, Position]]
  ): Future[Boolean]

  def delete(orgId: Long, id: DashboardId): Future[Boolean]

  def multiDelete(orgId: Long, ids: Array[DashboardId]): Future[Boolean]

  def update(orgId: Long, id: DashboardId, dashboard: Dashboard): Future[Boolean]

  def listDashboards(orgId: Long, request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]]

  // scan all database
  // method for migrate
  def scan(chunkSize: Int)(fn: Seq[Dashboard] => Future[Unit]): Future[Unit]

  def updateOwnerId(orgId: Long, fromUsername: UserId, toUsername: UserId): Future[Boolean]

  def updateCreatorId(orgId: Long, fromUsername: UserId, toUsername: UserId): Future[Boolean]

  def deleteByOrgId(orgId: DashboardId): Future[Boolean]
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

  override def list(orgId: Long, from: Int, size: Int, useAsTemplate: Option[Boolean] = None): Future[Seq[Dashboard]] =
    Future {
      val (conditionClause, conditionArgs) = buildConditionClause(orgId, useAsTemplate)

      val query =
        s"""
           |select * from $dbName.$tblDashboardName
           |where $conditionClause
           |limit ? offset ?
           |""".stripMargin

      val args: Seq[Any] = conditionArgs ++ Seq(size, from)

      client.executeQuery(query, args: _*)(toDashboards)
    }

  override def count(orgId: Long, useAsTemplate: Option[Boolean] = None): Future[DashboardId] =
    Future {
      val (conditionClause, conditionArgs) = buildConditionClause(orgId, useAsTemplate)

      val countQuery =
        s"""
           |select count(1)
           |from $dbName.$tblDashboardName
           |where $conditionClause
           |""".stripMargin

      client.executeQuery(countQuery, conditionArgs: _*)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else 0L
      })
    }

  override def get(orgId: Long, id: DashboardId): Future[Option[Dashboard]] =
    Future {
      client.executeQuery(s"""
         |select *
         |from $dbName.$tblDashboardName
         |where org_id = ? and id = ?;
         |""".stripMargin, orgId, id)(rs => {
        if (rs.next()) {
          Some(toDashboard(rs))
        } else {
          None
        }
      })
    }

  override def create(orgId: Long, dashboard: Dashboard): Future[DashboardId] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblDashboardName
         |(org_id, name, creator_id, owner_id, widgets, widget_positions, main_date_filter, boost_info, setting, use_as_template)
         |values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
         |""".stripMargin

      client.executeInsert(
        query,
        orgId,
        dashboard.name,
        dashboard.creatorId,
        dashboard.ownerId,
        Serializer.toJson(dashboard.widgets),
        Serializer.toJson(dashboard.widgetPositions),
        Serializer.toJson(dashboard.mainDateFilter),
        Serializer.toJson(dashboard.boostInfo),
        Serializer.toJson(dashboard.setting),
        dashboard.useAsTemplate
      )
    }

  override def rename(orgId: Long, id: DashboardId, newName: String): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
          |update $dbName.$tblDashboardName
          |set name = ?
          |where org_id = ? and id = ?;
          |""".stripMargin,
        newName,
        orgId,
        id
      ) >= 1
    }

  override def updateMainDateFilter(
      orgId: Long,
      id: DashboardId,
      mainDateFilter: Option[MainDateFilter]
  ): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblDashboardName
         |set main_date_filter = ?
         |where org_id = ? and id = ?
         |""".stripMargin,
        Serializer.toJson(mainDateFilter),
        orgId,
        id
      ) >= 1
    }

  override def delete(orgId: Long, id: DashboardId): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |delete from $dbName.$tblDashboardName
         |where org_id = ? and id = ?;
         |""".stripMargin,
        orgId,
        id
      ) >= 1
    }

  override def updateWidgets(
      orgId: Long,
      id: DashboardId,
      widgets: Option[Array[Widget]],
      positions: Option[Map[WidgetId, Position]]
  ): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblDashboardName
         |set widgets = ?, widget_positions = ?
         |where org_id = ? and id = ?;
         |""".stripMargin,
        Serializer.toJson(widgets),
        Serializer.toJson(positions),
        orgId,
        id
      ) >= 1
    }

  override def update(orgId: Long, id: DashboardId, dashboard: Dashboard): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |update $dbName.$tblDashboardName
         |set name = ?, main_date_filter = ?, boost_info = ?, setting = ?, use_as_template = ?
         |where org_id = ? and id = ?;
         |""".stripMargin,
        dashboard.name,
        Serializer.toJson(dashboard.mainDateFilter),
        Serializer.toJson(dashboard.boostInfo),
        Serializer.toJson(dashboard.setting),
        dashboard.useAsTemplate,
        orgId,
        id
      ) >= 1
    }

  private def toDashboard(rs: ResultSet): Dashboard = {
    val orgId = rs.getLong("org_id")
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
    val setting = Serializer.fromJson[Option[Map[String, JsonNode]]](rs.getString("setting"))
    val useAsTemplate = rs.getBoolean("use_as_template")

    Dashboard(
      orgId = orgId,
      id = id,
      name = name,
      creatorId = creatorId,
      ownerId = ownerId,
      widgets = Some(widgets),
      widgetPositions = Some(widgetPositions),
      mainDateFilter = mainDateFilter,
      boostInfo = boostInfo,
      setting = setting,
      useAsTemplate = useAsTemplate
    )
  }

  override def listDashboards(orgId: Long, request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]] =
    Future {
      PageResult(
        total = countTotalDrillThroughDashboards(orgId, request),
        data = getDrillThroughDashboards(orgId, request)
      )
    }

  private def buildConditionClause(orgId: Long, useAsTemplate: Option[Boolean]): (String, Seq[Any]) = {
    var conditionClause: String = "org_id = ? "
    val conditionArgs = ArrayBuffer[Any](orgId)

    if (useAsTemplate.isDefined) {
      conditionClause += "and use_as_template = ? "
      conditionArgs += useAsTemplate.get
    }

    (conditionClause, conditionArgs)
  }

  private def toDashboards(rs: ResultSet): Seq[Dashboard] = {
    val tableFields = ListBuffer[Dashboard]()
    while (rs.next()) {
      tableFields += toDashboard(rs)
    }
    tableFields
  }

  private def getDrillThroughDashboards(orgId: Long, request: ListDrillThroughDashboardRequest): Seq[Dashboard] = {
    val queryData = prepareListDrillThroughDashboards(orgId, request)
    val selectDrillThroughDashboardQuery =
      s"""
         |SELECT dashboard.*
         |FROM $dbName.$tblDashboardName dashboard
         |INNER JOIN $dbName.$tblDirectoryName directory on dashboard.id = directory.dashboard_id
         |LEFT JOIN $dbName.$tblShareInfoName share_info on share_info.resource_id = directory.id
         |RIGHT JOIN (${queryDrillThroughDashboardId(request.fields)}) drill_field on dashboard.id = drill_field.dashboard_id
         |${buildWhereDrillThroughCause(request)}
         |ORDER BY dashboard.name ASC
         |LIMIT ?, ?
         |""".stripMargin
    client.executeQuery(selectDrillThroughDashboardQuery, queryData: _*)(toDashboards)
  }

  private def countTotalDrillThroughDashboards(orgId: Long, request: ListDrillThroughDashboardRequest): Long = {
    val queryData = prepareCountDrillThroughDashboards(orgId, request)
    val countDrillThroughDashboardQuery =
      s"""
         |SELECT COUNT(dashboard.id)
         |FROM $dbName.$tblDashboardName dashboard
         |INNER JOIN $dbName.$tblDirectoryName directory on dashboard.id = directory.dashboard_id
         |LEFT JOIN $dbName.$tblShareInfoName share_info on share_info.resource_id = directory.id
         |RIGHT JOIN (${queryDrillThroughDashboardId(request.fields)}) drill_field on dashboard.id = drill_field.dashboard_id
         | ${buildWhereDrillThroughCause(request)}
         |""".stripMargin

    client.executeQuery(countDrillThroughDashboardQuery, queryData: _*)(rs => if (rs.next()) rs.getLong(1) else 0)
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
         |WHERE directory.org_id = ?
         |	and directory.is_removed = ?
         |	and (share_info.is_deleted = FALSE or share_info.is_deleted is NULL)
         |	and (
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

  private def prepareListDrillThroughDashboards(orgId: Long, request: ListDrillThroughDashboardRequest): Record = {
    val params = ArrayBuffer.empty[Any]
    val fieldIds: Seq[String] = request.fields.map(field => field.normalizedFieldName)
    params.appendAll(fieldIds)
    params.append(
      orgId,
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

  private def prepareCountDrillThroughDashboards(orgId: Long, request: ListDrillThroughDashboardRequest): Record = {
    val params = ArrayBuffer.empty[Any]
    val fieldIds: Seq[String] = request.fields.map(field => field.normalizedFieldName)
    params.appendAll(fieldIds)

    params.append(
      orgId,
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
      orgId: Long,
      fromUsername: UserId,
      toUsername: UserId
  ): Future[Boolean] =
    Future {
      val query = s"update $dbName.$tblDashboardName set owner_id = ? where org_id = ? and owner_id = ?"
      client.executeUpdate(query, toUsername, orgId, fromUsername) > 0
    }

  override def updateCreatorId(
      orgId: Long,
      fromUsername: UserId,
      toUsername: UserId
  ): Future[Boolean] =
    Future {
      val query = s"update $dbName.$tblDashboardName set creator_id = ? where org_id = ? and creator_id = ?"
      client.executeUpdate(query, toUsername, orgId, fromUsername) > 0
    }

  override def multiDelete(orgId: Long, ids: Array[DashboardId]): Future[Boolean] =
    Future {
      if (ids.isEmpty) {
        true
      } else {
        val args = Array(orgId) ++ ids
        val query = s"delete from $dbName.$tblDashboardName where org_id = ? and id in (${createParams(ids.length)})"
        client.executeUpdate(query, args: _*) > 0
      }
    }

  override def deleteByOrgId(orgId: DashboardId): Future[Boolean] =
    Future {
      val query = s"delete from $dbName.$tblDashboardName where org_id = ?"
      client.executeUpdate(query, orgId) > 0
    }
}
