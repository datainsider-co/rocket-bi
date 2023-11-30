package co.datainsider.jobworker.client.mixpanel

class EngagementResponse {}

case class MixpanelResponse[T](
    status: String,
    results: T
) {
  def isSuccess: Boolean = status == "ok"
}
