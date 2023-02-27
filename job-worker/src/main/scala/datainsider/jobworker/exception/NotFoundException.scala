package datainsider.jobworker.exception

import com.twitter.finagle.http.Status
import datainsider.client.exception.DIException

class NotFoundException(message: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason: String = BaseException.NotFoundException

  override def getStatus: Status = Status.NotFound
}
