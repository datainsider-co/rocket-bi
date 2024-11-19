package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class EmailInvalidError(
    message: String = "Email is invalid.",
    cause: Throwable = null
) extends DIException(message, cause) {
  override val reason = DIErrorReason.EmailInvalid
  override def getStatus: Status = Status.BadRequest
}
