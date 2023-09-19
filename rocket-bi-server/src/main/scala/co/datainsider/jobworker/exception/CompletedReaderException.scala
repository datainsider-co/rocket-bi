package co.datainsider.jobworker.exception

import com.twitter.finagle.http.Status
import datainsider.client.exception.DIException

case class CompletedReaderException(message: String, cause: Throwable = null) extends ReaderException(message, cause) {
  override val reason: String = BaseException.AlreadyCompletedException

  override def getStatus: Status = Status.InternalServerError
}
