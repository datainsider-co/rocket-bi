package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class RegistrationRequiredError(message: String = "Registration Required", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.RegistrationRequired
  override def getStatus: Status = Status.BadRequest
}
