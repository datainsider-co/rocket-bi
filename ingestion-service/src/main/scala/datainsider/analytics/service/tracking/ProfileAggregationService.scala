package datainsider.analytics.service.tracking

import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.analytics.domain.ProfileColumnIds
import datainsider.analytics.controller.http.request.UpdateProfileRequest
import datainsider.analytics.repository.TrackingDataRepository
import datainsider.client.domain.Implicits.ScalaFutureLike
import education.x.commons.{KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

@deprecated("no longer used")
trait ProfileAggregationService {
  def updateUserFirstSeen(organizationId: Long, userId: String, time: Long): Future[Unit]

  def updateUserLastSeen(organizationId: Long, userId: String, time: Long): Future[Unit]
}

@deprecated("no longer used")
case class ProfileAggregationServiceImpl @Inject() (
    client: SSDB,
    trackingDataRepository: TrackingDataRepository
) extends ProfileAggregationService
    with Logging {

  override def updateUserFirstSeen(organizationId: Long, userId: String, time: Long): Future[Unit] = {

    val kvs = getFirstSeenKVS(organizationId)

    val updateIfNotExist = (previousTime: Option[Long]) => {
      previousTime match {
        case Some(time) => Future.Unit
        case None =>
          kvs
            .add(userId, time)
            .asTwitter
            .flatMap(_ => {
              setUserFirstSeen(organizationId, userId, time)
            })
      }
    }
    kvs
      .get(userId)
      .asTwitter
      .flatMap(updateIfNotExist)
  }

  override def updateUserLastSeen(organizationId: Long, userId: String, time: Long): Future[Unit] = {
    val request = UpdateProfileRequest(
      userId = userId,
      organizationId = Some(organizationId),
      properties = Map(
        ProfileColumnIds.LAST_SEEN_AT -> time
      )
    )

    trackingDataRepository.updateProfile(request.getOrganizationId(), request.toTrackingUserProfile()).transform {
      case Return(r) => Future.Unit
      case Throw(ex) =>
        error("Error to update user's last seen status", ex)
        Future.Unit
    }
  }

  private def getFirstSeenKVS(organizationId: Long): KVS[String, Long] = {
    SsdbKVS[String, Long](s"di.tracking.user_first_seen.$organizationId", client)
  }

  private def setUserFirstSeen(organizationId: Long, userId: String, time: Long): Future[Unit] = {
    val request = UpdateProfileRequest(
      userId = userId,
      organizationId = Some(organizationId),
      properties = Map(
        ProfileColumnIds.FIRST_SEEN_AT -> time
      )
    )

    trackingDataRepository.updateProfile(request.getOrganizationId(), request.toTrackingUserProfile()).transform {
      case Return(r) => Future.Unit
      case Throw(ex) =>
        error("Error to update user's first seen status", ex)
        Future.Unit
    }
  }

}
