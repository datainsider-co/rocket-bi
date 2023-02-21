package datainsider.analytics.domain.commands

case class TrackProfileCommand(
    organizationId: Long,
    trackingApiKey: String,
    userId: String,
    properties: Map[String, Any]
)
