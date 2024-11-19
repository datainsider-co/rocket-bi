package co.datainsider.common.client.exception

case class InternalError(message: String = null, cause: Throwable = null) extends DIException(message, cause) {
  override val reason = DIErrorReason.InternalError
  override def getStatus = com.twitter.finagle.http.Status.InternalServerError
}
