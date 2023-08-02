package co.datainsider.jobworker.exception

import com.twitter.finagle.http.Status
import datainsider.client.exception.DIException

/**
 * created 2022-09-12 6:23 PM
 *
 * @author tvc12 - Thien Vi
 */
class ReaderException(message: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason: String = BaseException.ReaderException

  override def getStatus: Status = Status.InternalServerError
}
