package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

case class InsufficientPermissionError(message: String = "Insufficient Permission", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason: String = DIErrorReason.InsufficientPermission
  override def getStatus: Status = com.twitter.finagle.http.Status.Forbidden
}
