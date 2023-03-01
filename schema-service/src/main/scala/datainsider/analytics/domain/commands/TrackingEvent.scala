package datainsider.analytics.domain.commands

import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.analytics.domain.EventColumnIds
import datainsider.client.domain.Implicits.RichOptionString

case class TrackingEvent(
    name: String,
    properties: Map[String, Any]
) {

  def getTrackingUserId(): Option[String] = {
    properties
      .get(EventColumnIds.USER_ID)
      .map(_.toString)
      .notNullOrEmpty
  }
}

case class EventBatch(
    orgId: Long,
    timestamp: Long,
    trackingApiKey: String,
    events: Seq[TrackingEvent]
)
