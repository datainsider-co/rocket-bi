package com.ptl.hubspot.engagement

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonNaming
import com.ptl.util.JsonUtil._
/**
 * Created by phuonglam on 3/3/17.
 **/

@JsonNaming
case class Engagement(
  engagement: EngagementInfo,
  associations: EngagementAssociation,
  scheduledTask: Seq[EngagementScheduledTask] = Seq(),
  metadata: Map[String, Any]
)

@JsonNaming
case class EngagementInfo(
  id: Long,
  portalId: Long,
  active: Boolean,
  createdAt: Long,
  lastUpdated: Long,
  createdBy: Long,
  modifiedBy: Long,
  ownerId: Long,
  `type`: String,
  timestamp: Long
)

@JsonNaming
case class EngagementAssociation(
  contactIds: Array[Long] = Array(),
  companyIds: Array[Long] = Array(),
  dealIds: Array[Long] = Array(),
  ownerIds: Array[Long] = Array(),
  workflowIds: Array[Long] = Array()
)

@JsonNaming
case class EngagementScheduledTask(
  engagementId: Long,
  portalId: Long,
  engagementType: String,
  taskType: String,
  timestamp: Long,
  uuid: String
)

@JsonNaming
case class GetEngagementResponse(
  results: Seq[Engagement],
  offset: Long,
  hasMore: Boolean,
  total: Option[Long] = None
)

object EngagementRequest {
  def buildSourceCreate(req: CreateEngagementRequest): String = {
    var mapEngagement = Map("type" -> req.engagementType, "timestamp" -> req.timestamp)
    req.ownerId.foreach(ownerId => mapEngagement = mapEngagement + ("ownerId" -> ownerId))
    req.uid.foreach(uid => mapEngagement = mapEngagement + ("uid" -> uid))
    Map(
      "associations" -> Map("ownerIds" -> Seq.empty, "contactIds" -> req.contactIds),
      "engagement" -> mapEngagement,
      "metadata" -> req.metadata,
      "attachments" -> req.attachments.map(f => Map("id" -> f)),
      "scheduledTasks" -> req.scheduledTask,
      "inviteeEmails" -> Seq.empty
    ).toJsonString
  }

  def buildSourceUpdate(req: UpdateEngagementRequest): String = {
    val mapEngagement = scala.collection.mutable.Map.empty[String, Any]
    req.engagementType.foreach(enType => mapEngagement("type") = enType)
    req.timestamp.foreach(timestamp => mapEngagement("timestamp") = timestamp)
    req.ownerId.foreach(ownerId => mapEngagement("ownerId") = ownerId)
    req.uid.foreach(uid => mapEngagement("uid") = uid)

    val mapData = scala.collection.mutable.Map.empty[String, Any]
    req.contactIds.foreach(contactIds => mapData("associations") = Map("contactIds" -> contactIds))
    if (mapEngagement.nonEmpty) mapData("engagement") = mapEngagement
    req.metadata.foreach(metadata => mapData("metadata") = metadata)
    req.attachments.foreach(attachments => mapData("attachments") = attachments.map(f => Map("id" -> f)))
    req.scheduledTask.foreach(scheduledTask => mapData("scheduledTasks") = scheduledTask)

    mapData.toJsonString
  }
}

case class CreateEngagementRequest(
  cookies: Option[String],
  portalId: Long,
  contactIds: Seq[Long],
  engagementType: String,
  timestamp: Long,
  ownerId: Option[Long] = None,
  attachments: Seq[Long] = Seq.empty,
  metadata: EngagementMetadata,
  scheduledTask: Seq[EngagementScheduledTask] = Seq(),
  uid: Option[String] = None
) {
  val source: String = EngagementRequest.buildSourceCreate(this)
}

case class UpdateEngagementRequest(
  engagementId: String,
  cookies: Option[String] = None,
  contactIds: Option[Seq[Long]] = None,
  engagementType: Option[String] = None,
  timestamp: Option[Long] = None,
  ownerId: Option[Long] = None,
  attachments: Option[Seq[Long]] = None,
  metadata: Option[EngagementMetadata],
  scheduledTask: Option[Seq[EngagementScheduledTask]] = None,
  uid: Option[String] = None
) {
  val source: String = EngagementRequest.buildSourceUpdate(this)
}

class EngagementMetadata()


@JsonNaming
case class CallEngagementMetadata(
  body: Option[String] = None,
  recordingUrl: Option[String] = None,
  durationMilliseconds: Option[Long] = None,
  toNumber: Option[String] = None,
  fromNumber: Option[String] = None,
  @JsonIgnore callOutcome: Option[String] = None,
  status: Option[String] = None
) extends EngagementMetadata {
  val disposition: Option[String] = callOutcome match {
    case Some(x) => Some(x.toString)
    case _ => None
  }
}