package co.datainsider.bi.service

import co.datainsider.bi.repository.UserActivityRepository
import co.datainsider.bi.util.tracker.ActionType.ActionType
import co.datainsider.bi.util.tracker.ResourceType.ResourceType
import co.datainsider.bi.util.tracker.{TrackUserActivitiesRequest, UserActivityEvent}
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.share.domain.response.PageResult
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.async

import java.util.concurrent.{LinkedBlockingQueue, TimeUnit}

trait UserActivityService {
  def track(request: TrackUserActivitiesRequest): Future[Boolean]

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
  ): Future[PageResult[UserActivityEvent]]
}

class UserActivityServiceImpl @Inject() (userActivityRepository: UserActivityRepository)
    extends UserActivityService
    with Logging {

  val maxQueueSize: Int = 1000
  val enqueueTimeoutMs: Long = 100

  private val requestsQueue = new LinkedBlockingQueue[TrackUserActivitiesRequest](maxQueueSize)

  override def track(request: TrackUserActivitiesRequest): Future[Boolean] =
    Future {
      requestsQueue.offer(request, enqueueTimeoutMs, TimeUnit.MILLISECONDS)
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
  ): Future[PageResult[UserActivityEvent]] = {
    for {
      activities <- userActivityRepository.list(
        orgId,
        startTime,
        endTime,
        usernames,
        actionNames,
        actionTypes,
        resourceTypes,
        statusCodes,
        from,
        size
      )
      total <- userActivityRepository.count(
        orgId,
        startTime,
        endTime,
        usernames,
        actionNames,
        actionTypes,
        resourceTypes,
        statusCodes
      )
    } yield PageResult(total, activities)
  }

  private def insertTrackData(): Future[Unit] = {
    async {
      while (true) {
        try {
          val request: TrackUserActivitiesRequest = requestsQueue.take()
          userActivityRepository.insert(request.activities).syncGet()
        } catch {
          case e: Throwable => logger.error(s"ingesting user activities event failed: ${e.getMessage}")
        }
      }
    }
  }

  insertTrackData()

}
