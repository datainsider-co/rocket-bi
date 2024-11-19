package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class EmailNotExistedError(
    message: String = "Email Not Exists",
    cause: Throwable = null
) extends DIException(message, cause) {
  override val reason = DIErrorReason.EmailNotExisted
  override def getStatus: Status = Status.BadRequest
}
