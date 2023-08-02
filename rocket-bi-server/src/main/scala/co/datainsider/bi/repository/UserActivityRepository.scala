package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.tracker.ActionType.ActionType
import co.datainsider.bi.util.tracker.ResourceType.ResourceType
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityEvent}
import com.twitter.util.Future

import java.sql.ResultSet
import java.util.UUID
import scala.collection.mutable.ArrayBuffer
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

case class MySqlUserActivityRepository(client: JdbcClient, dbName: String, tblName: String)
    extends MySqlSchemaManager
    with UserActivityRepository {

  override val requiredFields: Seq[String] = Seq(
    "event_id",
    "org_id",
    "timestamp",
    "username",
    "action_type",
    "action_name",
    "resource_type",
    "resource_id",
    "message",
    "remote_host",
    "remote_address",
    "method",
    "path",
    "param",
    "status_code",
    "request_size",
    "request_content",
    "response_size",
    "response_content",
    "exec_time_ms"
  )

  override def createTable(): Future[Boolean] =
    Future {
      val createTableQuery =
        s"""
           |CREATE TABLE IF NOT EXISTS $dbName.$tblName (
           |  org_id INT NOT NULL,
           |  timestamp BIGINT NOT NULL,
           |  event_id VARCHAR(36) NOT NULL,
           |  username TINYTEXT,
           |  action_type TINYTEXT,
           |  action_name TINYTEXT,
           |  resource_type TINYTEXT,
           |  resource_id TINYTEXT,
           |  message TEXT,
           |  remote_host TINYTEXT,
           |  remote_address TINYTEXT,
           |  method TINYTEXT,
           |  path TINYTEXT,
           |  param TINYTEXT,
           |  status_code INT,
           |  request_size INT,
           |  request_content TEXT,
           |  response_size INT,
           |  response_content TEXT,
           |  exec_time_ms INT,
           |  PRIMARY KEY (org_id, timestamp)
           |) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;
           |""".stripMargin

      client.executeUpdate(createTableQuery) >= 0
    }

  override def insert(activities: Seq[UserActivityEvent]): Future[Int] =
    Future {
      val insertQuery =
        s"""
           |INSERT INTO $dbName.$tblName (event_id, org_id, timestamp, username, action_type, action_name, resource_type, resource_id, message, 
           |  remote_host, remote_address, method, path, param, status_code, request_size, request_content, response_size, response_content, exec_time_ms)
           |VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           |""".stripMargin

      val records: Array[Record] = activities
        .map(activity =>
          Array(
            UUID.randomUUID().toString,
            activity.orgId,
            activity.timestamp,
            activity.username,
            activity.actionType.toString,
            activity.actionName,
            activity.resourceType.toString,
            activity.resourceId,
            activity.message,
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
            activity.execTimeMs
          )
        )
        .toArray

      client.executeBatchUpdate(insertQuery, records)
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
    Future {
      val (additionalConditions, conditionArgs) =
        buildConditions(startTime, endTime, usernames, actionNames, actionTypes, resourceTypes, statusCodes)

      val selectQuery =
        s"""
           |select * from $dbName.$tblName
           |where org_id = ? $additionalConditions
           |order by timestamp asc
           |limit ? offset ?
           |""".stripMargin

      val args: Seq[Any] = Seq(orgId) ++ conditionArgs ++ Seq(size, from)

      client.executeQuery(selectQuery, args: _*)(toActivities)
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
    Future {
      val (additionalConditions, conditionArgs) =
        buildConditions(startTime, endTime, usernames, actionNames, actionTypes, resourceTypes, statusCodes)

      val countQuery =
        s"""
           |select count(1) from $dbName.$tblName
           |where org_id = ? $additionalConditions
           |""".stripMargin

      val args: Seq[Any] = Seq(orgId) ++ conditionArgs

      client.executeQuery(countQuery, args: _*)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else 0L
      })
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
      conditionStr += s" and username in (${Seq.fill(usernames.size)("?").mkString(",")})"
      conditionArgs ++= usernames
    }

    if (actionNames.nonEmpty) {
      conditionStr += s" and action_name in (${Seq.fill(actionNames.size)("?").mkString(",")})"
      conditionArgs ++= actionNames
    }

    if (actionTypes.nonEmpty) {
      conditionStr += s" and action_type in (${Seq.fill(actionTypes.size)("?").mkString(",")})"
      conditionArgs ++= actionTypes.map(_.toString)
    }

    if (resourceTypes.nonEmpty) {
      conditionStr += s" and resource_type in (${Seq.fill(resourceTypes.size)("?").mkString(",")})"
      conditionArgs ++= resourceTypes.map(_.toString)
    }

    if (statusCodes.nonEmpty) {
      conditionStr += s" and status_code in (${Seq.fill(statusCodes.size)("?").mkString(",")})"
      conditionArgs ++= statusCodes
    }

    (conditionStr, conditionArgs)
  }

  private def toActivities(rs: ResultSet): Seq[UserActivityEvent] = {
    val activities = ArrayBuffer[UserActivityEvent]()

    while (rs.next()) {
      activities += UserActivityEvent(
        eventId = rs.getString("event_id"),
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
        execTimeMs = rs.getInt("exec_time_ms"),
        message = rs.getString("message")
      )
    }

    activities
  }

}
