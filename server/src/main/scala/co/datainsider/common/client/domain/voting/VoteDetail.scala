package co.datainsider.common.client.domain.voting

import com.fasterxml.jackson.core.`type`.TypeReference
import co.datainsider.common.client.domain.voting.VoteStatus.VoteStatus

case class VoteDetail(votes: Map[String, VoteStatus], statistics: Map[String, VotingMetric])

case class VotingMetric(objectType: String, objectId: String, likes: Long, dislikes: Long)

case class VoteHistoryInfo(
    username: String,
    objectType: String,
    objectId: String,
    status: VoteStatus,
    updatedTime: Long,
    createdTime: Long
)

object VoteStatus extends Enumeration {
  type VoteStatus = VoteStatus.Value
  val None: VoteStatus = Value(0)
  val Liked: VoteStatus = Value(1)
  val Disliked: VoteStatus = Value(2)
}

object TimeRange extends Enumeration {
  type TimeRange = Value
  val OneHour: TimeRange = Value("1h")
  val ThreeHours: TimeRange = Value("3h")
  val TwelveHours: TimeRange = Value("12h")
  val OneDay: TimeRange = Value("1d")
  val ThreeDays: TimeRange = Value("3d")
  val OneWeek: TimeRange = Value("7d")
  val OneMonth: TimeRange = Value("30d")
}

class TimeRangeRef extends TypeReference[TimeRange.type]
