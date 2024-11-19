package co.datainsider.common.client.exception

case class UnAuthenticatedError(message: String = "Not Authenticated", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.NotAuthenticated
  override def getStatus = com.twitter.finagle.http.Status.Unauthorized
}
