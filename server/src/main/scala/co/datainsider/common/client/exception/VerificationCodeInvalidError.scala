package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class VerificationCodeInvalidError(
    message: String = "Invalid Code",
    cause: Throwable = null
) extends DIException(message, cause) {

  override val reason = DIErrorReason.VerificationCodeInvalid

  override def getStatus: Status = Status.BadRequest
}
