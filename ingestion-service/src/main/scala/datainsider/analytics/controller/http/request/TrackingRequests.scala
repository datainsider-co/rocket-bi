package datainsider.analytics.controller.http.request

import com.fasterxml.jackson.databind.node.ObjectNode
import com.google.inject.Inject
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{NotEmpty, Pattern}
import com.twitter.util.Future
import datainsider.analytics.domain.{EventColumnIds, TrackingProfile}
import datainsider.analytics.domain.commands.{EventBatch, TrackProfileCommand, TrackingEvent}
import datainsider.analytics.misc.TrackingProfileConverter
import datainsider.analytics.service.tracking.ApiKeyService
import datainsider.client.filter.LoggedInRequest
import datainsider.client.service.OrgClientService
import datainsider.client.util.JsonParser
import datainsider.ingestion.controller.http.filter.RequestOrganizationContext
import datainsider.ingestion.controller.http.requests.OrgContextRequest
import datainsider.ingestion.util.Implicits.ImplicitRequestLike
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

class TrackingApiKeyParser @Inject() (
    apiKeyService: ApiKeyService,
    orgClientService: OrgClientService
) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val trackingApiKey = request.getQueryOrBodyParam("tracking_api_key")
    for {
      trackingApiKeyInfo <- apiKeyService.getApiKey(trackingApiKey)
      organization <- orgClientService.getOrganization(trackingApiKeyInfo.organizationId)
      _ = RequestOrganizationContext.setOrganization(request, Some(organization))
      response <- service(request)
    } yield response
  }

}

case class GenTrackingIdRequest(
    @NotEmpty trackingApiKey: String,
    @Inject request: Request = null
) extends OrgContextRequest

case class TrackingRequest(
    @NotEmpty trackingApiKey: String,
    @NotEmpty @Pattern(regexp = "\\w+") event: String,
    properties: ObjectNode,
    @Inject request: Request = null
) extends OrgContextRequest {

  def toTrackingEvent(): TrackingEvent = {
    TrackingEvent(
      name = event,
      properties = JsonParser.fromNode[Map[String, Any]](properties) ++ Map(EventColumnIds.CLIENT_IP -> clientIp)
    )
  }
}

case class BatchTrackingRequest(
    @NotEmpty trackingApiKey: String,
    @NotEmpty events: Seq[TrackingEvent],
    @Inject request: Request = null
) extends OrgContextRequest {

  def toEventsBatch: EventBatch = {
    EventBatch(
      orgId = this.organizationId,
      timestamp = System.currentTimeMillis(),
      trackingApiKey = trackingApiKey,
      events = events
    )
  }
}

case class TrackProfileRequest(
    @NotEmpty trackingApiKey: String,
    @NotEmpty userId: String,
    properties: ObjectNode,
    @Inject request: Request = null
) extends OrgContextRequest {

  def toCommand(): TrackProfileCommand = {
    TrackProfileCommand(
      organizationId,
      trackingApiKey = trackingApiKey,
      userId = userId,
      properties = JsonParser.fromNode[Map[String, Any]](properties)
    )
  }
}

case class UpdateProfileRequest(
    @RouteParam @NotEmpty userId: String,
    properties: Map[String, Any],
    organizationId: Option[Long] = Some(1L),
    @Inject request: Request = null
) extends LoggedInRequest {

  override def getOrganizationId() = organizationId.get

  def toTrackingUserProfile(): TrackingProfile = {
    TrackingProfileConverter.buildTrackingProfile(userId, "", properties)
  }
}
