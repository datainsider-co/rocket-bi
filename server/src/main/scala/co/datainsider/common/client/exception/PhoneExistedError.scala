package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class PhoneExistedError(message: String = null, cause: Throwable = null) extends DIException(message, cause) {
  override val reason = DIErrorReason.PhoneExisted
  override def getStatus: Status = Status.BadRequest
}
