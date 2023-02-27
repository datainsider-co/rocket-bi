package datainsider.jobworker.exception

import com.twitter.finagle.http.Status
import datainsider.client.exception.DIException

/**
 * created 2022-09-13 4:07 PM
 *
 * @author tvc12 - Thien Vi
 */

case class CreateWorkerException(message: String, cause: Throwable = null)  extends DIException(message, cause) {
  override val reason: String = BaseException.CreateWorkerException

  override def getStatus: Status = Status.InternalServerError
}
