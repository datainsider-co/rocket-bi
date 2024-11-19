package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class EmailExistedError(
    message: String = "Email Exists",
    cause: Throwable = null
) extends DIException(message, cause) {
  override val reason = DIErrorReason.EmailExisted
  override def getStatus: Status = Status.BadRequest
}
