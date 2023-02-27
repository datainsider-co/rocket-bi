package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{StringColumn, UInt16Column, UInt32Column, UInt64Column}
import datainsider.client.service.SchemaClientService
import datainsider.client.util.UserActivityTrackingClient.{SYSTEM_DB, USER_ACTIVITIES_TBL}
import datainsider.profiler.Profiler
import datainsider.tracker.ActionType.ActionType
import datainsider.tracker.ResourceType.ResourceType
import datainsider.tracker.{ActionType, ResourceType, UserActivityEvent}

import java.sql.ResultSet
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

trait UserActivityRepository {
  def insert(activities: Seq[UserActivityEvent]): Future[Int]

  def list(
      orgId: Long,
      startTime: Option[Long],
      endTime: Option[Long],
      usernames: Seq[String],
      actionNames: Seq[String],
      actionTypes: Seq[ActionType],
      resourceTypes: Seq[ResourceType],
      statusCodes: Seq[Int],
      from: Int,
      size: Int
  ): Future[Seq[UserActivityEvent]]

  def count(
      orgId: Long,
      startTime: Option[Long],
      endTime: Option[Long],
      usernames: Seq[String],
      actionNames: Seq[String],
      actionTypes: Seq[ActionType],
      resourceTypes: Seq[ResourceType],
      statusCodes: Seq[Int]
  ): Future[Long]
}

class ClickhouseActivityRepository @Inject() (
    @Named("clickhouse") client: JdbcClient,
    schemaClientService: SchemaClientService
) extends UserActivityRepository
    with Logging {

  private val initializedOrgIds = mutable.Set[Long]()

  private def ACTIVITIES_SCHEMA(orgId: Long): TableSchema = {
    TableSchema(
      organizationId = orgId,
      dbName = SYSTEM_DB(orgId),
      name = USER_ACTIVITIES_TBL,
      displayName = USER_ACTIVITIES_TBL,
      columns = Seq(
        UInt64Column(name = "timestamp", displayName = "Timestamp", isNullable = false),
        UInt16Column(name = "org_id", displayName = "Organization Id"),
        StringColumn(name = "username", displayName = "Username", isNullable = true),
        StringColumn(name = "action_name", displayName = "Action Name", isNullable = false),
        StringColumn(name = "action_type", displayName = "Action Type", isNullable = true),
        StringColumn(name = "resource_type", displayName = "Resource Type", isNullable = true),
        StringColumn(name = "resource_id", displayName = "Resource Id", isNullable = true),
        StringColumn(name = "remote_host", displayName = "Remote Host", isNullable = true),
        StringColumn(name = "remote_address", displayName = "Remote Address", isNullable = true),
        StringColumn(name = "method", displayName = "Method", isNullable = true),
        StringColumn(name = "path", displayName = "Path", isNullable = true),
        StringColumn(name = "param", displayName = "Param", isNullable = true),
        UInt16Column(name = "status_code", displayName = "Status Code", isNullable = true),
        UInt32Column(name = "request_size", displayName = "Request Size", isNullable = true),
        StringColumn(name = "request_content", displayName = "Request Content", isNullable = true),
        UInt32Column(name = "response_size", displayName = "Response Size", isNullable = true),
        StringColumn(name = "response_content", displayName = "Response Content", isNullable = true),
        UInt32Column(name = "execution_time", displayName = "Execution Time", isNullable = true),
        StringColumn(name = "message", displayName = "Message", isNullable = true)
      )
    )
  }

  override def insert(activities: Seq[UserActivityEvent]): Future[Int] =
    Profiler(s"[UserActivities] ${this.getClass.getSimpleName}::insert") {
      Future {
        activities
          .groupBy(_.orgId)
          .map {
            case (orgId, activities) =>
              try {
                write(orgId, activities)
              } catch {
                case e: Throwable =>
                  logger.error(s"write user activity records fail: ${e.getMessage}")
                  0
              }
          }
          .sum
      }
    }

  override def list(
      orgId: Long,
      startTime: Option[Long],
      endTime: Option[Long],
      usernames: Seq[String],
      actionNames: Seq[String],
      actionTypes: Seq[ActionType],
      resourceTypes: Seq[ResourceType],
      statusCodes: Seq[Int],
      from: Int,
      size: Int
  ): Future[Seq[UserActivityEvent]] =
    Profiler(s"[UserActivities] ${this.getClass.getSimpleName}::list") {
      Future {
        val dbName: String = ACTIVITIES_SCHEMA(orgId).dbName
        val tblName: String = ACTIVITIES_SCHEMA(orgId).name
        ensureActivitiesSchema(orgId)

        val (additionalConditions, conditionArgs) =
          buildConditions(startTime, endTime, usernames, actionNames, actionTypes, resourceTypes, statusCodes)

        val query =
          s"""
             |select * from $dbName.$tblName
             |where org_id = ? $additionalConditions
             |order by timestamp asc
             |limit ? offset ?
             |""".stripMargin

        val args: Seq[Any] = Seq(orgId) ++ conditionArgs ++ Seq(size, from)

        client.executeQuery(query, args: _*)(toActivities)
      }
    }

  override def count(
      orgId: Long,
      startTime: Option[Long],
      endTime: Option[Long],
      usernames: Seq[String],
      actionNames: Seq[String],
      actionTypes: Seq[ActionType],
      resourceTypes: Seq[ResourceType],
      statusCodes: Seq[Int]
  ): Future[Long] =
    Profiler(s"[UserActivities] ${this.getClass.getSimpleName}::count") {
      Future {
        val dbName: String = ACTIVITIES_SCHEMA(orgId).dbName
        val tblName: String = ACTIVITIES_SCHEMA(orgId).name
        ensureActivitiesSchema(orgId)

        val (additionalConditions, conditionArgs) =
          buildConditions(startTime, endTime, usernames, actionNames, actionTypes, resourceTypes, statusCodes)

        val query =
          s"""
           |select count(1) from $dbName.$tblName
           |where org_id = ? $additionalConditions
           |""".stripMargin

        val args: Seq[Any] = Seq(orgId) ++ conditionArgs

        client.executeQuery(query, args: _*)(rs => {
          if (rs.next()) {
            rs.getLong(1)
          } else 0L
        })
      }
    }

  private def buildConditions(
      startTime: Option[Long],
      endTime: Option[Long],
      usernames: Seq[String],
      actionNames: Seq[String],
      actionTypes: Seq[ActionType],
      resourceTypes: Seq[ResourceType],
      statusCodes: Seq[Int]
  ): (String, Seq[Any]) = {
    var conditionStr = ""
    val conditionArgs = ArrayBuffer[Any]()

    if (startTime.nonEmpty) {
      conditionStr += " and timestamp >= ?"
      conditionArgs += startTime.get
    }

    if (endTime.nonEmpty) {
      conditionStr += " and timestamp <= ?"
      conditionArgs += endTime.get
    }

    if (usernames.nonEmpty) {
      conditionStr += s" and username in [${Seq.fill(usernames.size)("?").mkString(",")}]"
      conditionArgs ++= usernames
    }

    if (actionNames.nonEmpty) {
      conditionStr += s" and action_name in [${Seq.fill(actionNames.size)("?").mkString(",")}]"
      conditionArgs ++= actionNames
    }

    if (actionTypes.nonEmpty) {
      conditionStr += s" and action_type in [${Seq.fill(actionTypes.size)("?").mkString(",")}]"
      conditionArgs ++= actionTypes.map(_.toString)
    }

    if (resourceTypes.nonEmpty) {
      conditionStr += s" and resource_type in [${Seq.fill(resourceTypes.size)("?").mkString(",")}]"
      conditionArgs ++= resourceTypes.map(_.toString)
    }

    if (statusCodes.nonEmpty) {
      conditionStr += s" and status_code in [${Seq.fill(statusCodes.size)("?").mkString(",")}]"
      conditionArgs ++= statusCodes
    }

    (conditionStr, conditionArgs)
  }

  private def toActivities(rs: ResultSet): Seq[UserActivityEvent] = {
    val activities = ArrayBuffer[UserActivityEvent]()

    while (rs.next()) {
      activities += UserActivityEvent(
        timestamp = rs.getLong("timestamp"),
        orgId = rs.getLong("org_id"),
        username = rs.getString("username"),
        actionName = rs.getString("action_name"),
        actionType = Try(ActionType.withName(rs.getString("action_type"))).getOrElse(ActionType.Other),
        resourceType = Try(ResourceType.withName(rs.getString("resource_type"))).getOrElse(ResourceType.Other),
        resourceId = rs.getString("resource_id"),
        remoteHost = rs.getString("remote_host"),
        remoteAddress = rs.getString("remote_address"),
        method = rs.getString("method"),
        path = rs.getString("path"),
        param = rs.getString("param"),
        statusCode = rs.getInt("status_code"),
        requestSize = rs.getInt("request_size"),
        responseSize = rs.getInt("response_size"),
        requestContent = rs.getString("request_content"),
        responseContent = rs.getString("response_content"),
        executionTime = rs.getInt("execution_time"),
        message = rs.getString("message")
      )
    }

    activities
  }

  private def write(orgId: Long, activities: Seq[UserActivityEvent]): Int =
    Profiler(s"[UserActivities] ${this.getClass.getSimpleName}::write") {
      val dbName: String = ACTIVITIES_SCHEMA(orgId).dbName
      val tblName: String = ACTIVITIES_SCHEMA(orgId).name
      val colNames: Seq[String] = ACTIVITIES_SCHEMA(orgId).columns.map(_.name)
      ensureActivitiesSchema(orgId)

      val records: Array[Array[Any]] = activities
        .map(activity => {
          Array(
            activity.timestamp,
            activity.orgId,
            activity.username,
            activity.actionName,
            activity.actionType.toString,
            activity.resourceType.toString,
            activity.resourceId,
            activity.remoteHost,
            activity.remoteAddress,
            activity.method,
            activity.path,
            activity.param,
            activity.statusCode,
            activity.requestSize,
            activity.requestContent,
            activity.responseSize,
            activity.responseContent,
            activity.executionTime,
            activity.message
          )
        })
        .toArray

      val query =
        s"""
         |insert into `$dbName`.`$tblName` (${colNames.mkString(", ")})
         |values(${Seq.fill(colNames.size)("?").mkString(", ")})
         |""".stripMargin

      client.executeBatchUpdate(query, records)
    }

  private def ensureActivitiesSchema(orgId: Long): Unit = {
    if (!initializedOrgIds.contains(orgId)) {
      schemaClientService.ensureDatabaseCreated(orgId, SYSTEM_DB(orgId), None).syncGet()
      schemaClientService.createOrMergeTableSchema(ACTIVITIES_SCHEMA(orgId)).syncGet()
      initializedOrgIds += orgId
      logger.info(s"initialize user activities schema for org $orgId")
    }
  }

}
