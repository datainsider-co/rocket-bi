package co.datainsider.bi.service

import co.datainsider.bi.domain.query.event.ActionType.ActionType
import co.datainsider.bi.domain.query.event.ResourceType.ResourceType
import co.datainsider.bi.domain.query.event.UserActivityEvent
import co.datainsider.bi.repository.UserActivityRepository
import co.datainsider.share.domain.response.PageResult
import com.google.inject.Inject
import com.twitter.util.Future

trait UserActivityService {
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

class UserActivityServiceImpl @Inject() (userActivityRepository: UserActivityRepository) extends UserActivityService {
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
}
