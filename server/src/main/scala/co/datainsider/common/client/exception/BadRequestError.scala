package co.datainsider.common.client.exception

case class BadRequestError(message: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason = DIErrorReason.BadRequest
  override def getStatus = com.twitter.finagle.http.Status.BadRequest
}
