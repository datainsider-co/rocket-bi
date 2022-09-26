package datainsider.analytics.service.tracking

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.analytics.controller.http.request.{BatchTrackingRequest, GenTrackingIdRequest, UpdateProfileRequest}
import datainsider.analytics.domain.EventData
import datainsider.analytics.domain.commands.{TrackingEvent, TrackProfileCommand}
import datainsider.analytics.misc.{PropertiesResolver, TrackingProfileConverter}
import datainsider.analytics.repository.TrackingDataRepository
import datainsider.analytics.service.generator.TrackingIdGenerator
import datainsider.client.exception.InternalError

import javax.inject.Inject

@deprecated("this is old tracking mechanism")
trait TrackingService {
  def genTrackingId(request: GenTrackingIdRequest): Future[String]

  def track(orgId: Long, request: TrackingEvent): Future[String]

  def trackProfile(request: TrackProfileCommand): Future[String]

  def updateProfile(request: UpdateProfileRequest): Future[Boolean]
}

@deprecated("this is old tracking mechanism")
case class TrackingServiceImpl @Inject() (
    trackingIdGenerator: TrackingIdGenerator,
    propertyResolver: PropertiesResolver,
    schemaMerger: TrackingSchemaMerger,
    trackingDataRepository: TrackingDataRepository
) extends TrackingService
    with Logging {

  override def genTrackingId(request: GenTrackingIdRequest): Future[String] = {
    trackingIdGenerator.generateTrackingId(request.organizationId)
  }

  /**
    * when tracked insert 1 record to event table and 1 record to specific event detail table
    */
  override def track(orgId: Long, request: TrackingEvent): Future[String] = {
    for {
      result <- propertyResolver.buildEventProperties(orgId, request)
      _ <- mergeEventSchema(orgId, result.toEventData())
      isSuccess <- trackingDataRepository.insertTrackingEvent(orgId, result.toEventData())
    } yield
      if (isSuccess) {
        result.trackingId
      } else {
        throw InternalError("No records were saved")
      }
  }

  /**
    * prepare table schema that match with list of properties from request
    */
  private def mergeEventSchema(organizationId: Long, eventData: EventData): Future[Unit] = {
    for {
      _ <- schemaMerger.mergeEventDetailSchema(organizationId, eventData.name, eventData.detailProperties)
    } yield {}
  }

  override def trackProfile(request: TrackProfileCommand): Future[String] = {
    for {
      (trackingId, properties) <- propertyResolver.buildProfileProperties(request.organizationId, request.properties)
      _ <- schemaMerger.mergeProfileSchema(request.organizationId, properties)
      isSuccess <- trackingDataRepository.insertOrUpdateProfile(
        request.organizationId,
        TrackingProfileConverter.buildTrackingProfile(request.userId, trackingId, properties)
      )
    } yield isSuccess match {
      case true  => trackingId
      case false => throw InternalError("Error to track user profile. Please try again later!")
    }
  }

  override def updateProfile(request: UpdateProfileRequest): Future[Boolean] = {
    trackingDataRepository.updateProfile(request.getOrganizationId(), request.toTrackingUserProfile())
  }

}
