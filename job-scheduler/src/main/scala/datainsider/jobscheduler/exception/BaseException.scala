package datainsider.jobscheduler.exception

import com.twitter.finagle.http.Status
/**
  * @author anhlt
  */

object BaseException {
  val BadRequest = "bad_request"
  val InternalError = "internal_error"
}

abstract class BaseException(val reason: String,
                             message: Option[String] = None,
                             cause: Throwable = null) extends Exception(message.getOrElse("Internal error"),cause) {

  def getStatus: Status

  override def getMessage: String = {
    if(message.nonEmpty) super.getMessage
    else if(cause!=null) cause.getMessage
    else message.getOrElse("Internal error")
  }
}


















