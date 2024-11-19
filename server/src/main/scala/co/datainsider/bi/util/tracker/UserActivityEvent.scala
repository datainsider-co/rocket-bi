package co.datainsider.bi.util.tracker

import co.datainsider.bi.util.tracker.ActionType.ActionType
import co.datainsider.bi.util.tracker.ResourceType.ResourceType
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

import java.util.UUID

case class UserActivityEvent(
    eventId: String = UUID.randomUUID().toString,
    timestamp: Long,
    orgId: Long,
    username: String,
    actionName: String,
    @JsonScalaEnumeration(classOf[ActionTypeRef])
    actionType: ActionType,
    @JsonScalaEnumeration(classOf[ResourceTypeRef])
    resourceType: ResourceType,
    resourceId: String = null,
    message: String = null,
    remoteHost: String,
    remoteAddress: String,
    method: String = null,
    path: String = null,
    param: String = null,
    statusCode: Int = 0,
    requestSize: Int = 0,
    responseSize: Int = 0,
    requestContent: String = null,
    responseContent: String = null,
    execTimeMs: Long = 0
)

object ActionType extends Enumeration {
  type ActionType = Value
  val View: ActionType = Value("View")
  val Create: ActionType = Value("Create")
  val Update: ActionType = Value("Update")
  val Delete: ActionType = Value("Delete")
  val Other: ActionType = Value("Other")

  // Marketing Actions
  val Call: ActionType = Value("Call")
  val SendSms: ActionType = Value("SendSms")
  val SendEmail: ActionType = Value("SendEmail")
  val PushNotification: ActionType = Value("PushNotification")
}

class ActionTypeRef extends TypeReference[ActionType.type]

object ResourceType extends Enumeration {
  type ResourceType = Value

  // bi-service resources
  val Dashboard: ResourceType = Value("Dashboard")
  val Directory: ResourceType = Value("Directory")
  val Widget: ResourceType = Value("Widget")
  val Relationship: ResourceType = Value("Relationship")
  val RlsPolicy: ResourceType = Value("RlsPolicy")

  // ingestion-service resources
  val Database: ResourceType = Value("Directory")
  val Table: ResourceType = Value("Table")
  val Source: ResourceType = Value("Source")
  val Job: ResourceType = Value("Job")
  val DataCook: ResourceType = Value("DataCook")
  val User: ResourceType = Value("User")
  val Connection: ResourceType = Value("Connection")
  val Other: ResourceType = Value("Other")

  // Marketing Resources
  val Customer: ResourceType = Value("Customer")
  val Product: ResourceType = Value("Product")
}

class ResourceTypeRef extends TypeReference[ResourceType.type]

case class TrackUserActivitiesRequest(activities: Seq[UserActivityEvent])
