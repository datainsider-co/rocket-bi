package co.datainsider.bi.domain.query.event

import co.datainsider.bi.domain.query.event.ActionType.{ActionType, Value}
import co.datainsider.bi.domain.query.event.ResourceType.ResourceType
import co.datainsider.bi.util.ZConfig
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.event.StreamingEvent

case class UserActivityEvent(
    timestamp: Long,
    orgId: Long,
    username: String,
    actionName: String,
    @JsonScalaEnumeration(classOf[ActionTypeRef]) actionType: ActionType,
    @JsonScalaEnumeration(classOf[ResourceTypeRef]) resourceType: ResourceType,
    remoteHost: String,
    remoteAddress: String,
    method: String,
    path: String,
    param: String,
    statusCode: Int,
    requestSize: Int,
    responseSize: Int,
    requestContent: String,
    responseContent: String,
    executionTime: Long,
    message: String
) extends StreamingEvent {

  override val dbName: String = ZConfig.getString("tracking_client.user_activities.db_name")
  override val tblName: String = ZConfig.getString("tracking_client.user_activities.table_name")

  override val properties: Map[String, Any] = Map[String, Any](
    "timestamp" -> timestamp,
    "org_id" -> orgId,
    "username" -> username,
    "action_name" -> actionName,
    "action_type" -> actionType.toString,
    "resource_type" -> resourceType.toString,
    "method" -> method,
    "remote_host" -> remoteHost,
    "remote_address" -> remoteAddress,
    "path" -> path,
    "param" -> param,
    "status_code" -> statusCode,
    "request_size" -> requestSize,
    "response_size" -> responseSize,
    "request_content" -> requestContent,
    "response_content" -> responseContent,
    "execution_time" -> executionTime,
    "message" -> message
  )
}

object ActionType extends Enumeration {
  type ActionType = Value
  val View: ActionType = Value("View")
  val Create: ActionType = Value("Create")
  val Update: ActionType = Value("Update")
  val Delete: ActionType = Value("Delete")
  val Other: ActionType = Value("Other")
}

class ActionTypeRef extends TypeReference[ActionType.type]

object ResourceType extends Enumeration {
  type ResourceType = Value
  val Dashboard: ResourceType = Value("Dashboard")
  val Directory: ResourceType = Value("Directory")
  val Widget: ResourceType = Value("Widget")
  val Database: ResourceType = Value("Directory")
  val Table: ResourceType = Value("Table")
  val Source: ResourceType = Value("Source")
  val Job: ResourceType = Value("Job")
  val Etl: ResourceType = Value("Etl")
  val Other: ResourceType = Value("Other")
}

class ResourceTypeRef extends TypeReference[ResourceType.type]
