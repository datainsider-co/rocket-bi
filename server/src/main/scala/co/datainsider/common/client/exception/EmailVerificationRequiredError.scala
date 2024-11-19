package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class EmailVerificationRequiredError(message: String = "Email Verification Required", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.EmailVerificationRequired
  override def getStatus: Status = Status.BadRequest
}
