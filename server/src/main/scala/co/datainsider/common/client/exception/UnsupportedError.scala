package co.datainsider.common.client.exception

case class UnsupportedError(message: String = "Unsupported", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.NotSupported
  override def getStatus = com.twitter.finagle.http.Status.NotImplemented
}
