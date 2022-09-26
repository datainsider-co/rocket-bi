package datainsider.user_profile.domain.profile

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.user_profile.domain.profile.ActionType.{ActionType, Value}
import datainsider.user_profile.domain.profile.ResourceType.ResourceType

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
)

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
