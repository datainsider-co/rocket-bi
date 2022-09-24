package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.query.event.ActionType.ActionType
import co.datainsider.bi.domain.query.event.ResourceType.ResourceType
import co.datainsider.bi.domain.query.event.{ActionType, ResourceType, UserActivityEvent}
import com.google.inject.Inject
import com.twitter.util.Future

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

trait UserActivityRepository {
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

class ClickhouseActivityRepository @Inject() (client: JdbcClient, dbName: String, tblName: String)
    extends UserActivityRepository {

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
}
