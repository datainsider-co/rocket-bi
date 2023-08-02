package co.datainsider.jobworker.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */

object BaseException {
  val BadRequest = "bad_request"
  val InternalError = "internal_error"
  val CreateReaderException = "create_reader_exception"
  val CreateJobProgressException = "create_job_progress_exception"
  val ReaderException = "reader_exception"
  val CreateWorkerException = "create_worker_exception"
  val AlreadyCompletedException = "already_completed_exception"
  val NotFoundException= "not_found_exception"
  val DataWriterException= "data_writer_exception"
  val FinishingDataWriterException= "finished_data_writer_exception"
}

abstract class BaseException(val reason: String, message: Option[String] = None, cause: Throwable = null)
    extends Exception(message.getOrElse("Internal error"), cause) {

  def getStatus: Status

  override def getMessage: String = {
    if (message.nonEmpty) super.getMessage
    else if (cause != null) cause.getMessage
    else message.getOrElse("Internal error")
  }
}
