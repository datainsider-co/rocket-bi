package co.datainsider.common.client.exception

case class ExpiredError(message: String = "Expired", cause: Throwable = null) extends DIException(message, cause) {
  override val reason = DIErrorReason.Expired
  override def getStatus = com.twitter.finagle.http.Status.Gone
}
