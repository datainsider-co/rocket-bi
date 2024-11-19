package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class PhoneInvalidError(message: String = null, cause: Throwable = null) extends DIException(message, cause) {
  override val reason = DIErrorReason.PhoneInvalid
  override def getStatus: Status = Status.BadRequest
}
