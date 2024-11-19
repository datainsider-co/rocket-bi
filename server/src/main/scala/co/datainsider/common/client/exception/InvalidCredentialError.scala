package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class InvalidCredentialError(message: String = "The credentials is not correct.", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.InvalidCredentials
  override def getStatus: Status = Status.BadRequest
}
