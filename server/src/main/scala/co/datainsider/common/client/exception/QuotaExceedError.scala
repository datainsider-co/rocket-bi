package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
case class QuotaExceedError(message: String = "Quota Exceed", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.QuotaExceed
  override def getStatus: Status = Status.BadRequest
}
