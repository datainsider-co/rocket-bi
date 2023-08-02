package co.datainsider.jobworker.exception

import com.twitter.finagle.http.Status
import datainsider.client.exception.DIException

class DataWriterException(message: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason: String = BaseException.DataWriterException

  override def getStatus: Status = Status.InternalServerError
}


case class FinishingDataWriterException(message: String, innerErrors: Seq[Throwable] = Seq.empty) extends DataWriterException(message, innerErrors.headOption.orNull) {
  override val reason: String = BaseException.FinishingDataWriterException

  override def getMessage: String = {
    val innerErrorsMessage: String = innerErrors.map(_.getMessage).mkString(",\n")
    s"${message}, cause ${innerErrorsMessage}"
  }

  override def getStatus: Status = Status.InternalServerError
}
