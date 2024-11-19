package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class UnAuthorizedError(message: String = "No Authorize", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.Unauthorized
  override def getStatus: Status = Status.Unauthorized
}
