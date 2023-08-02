package co.datainsider.bi.engine.factory

import com.twitter.finagle.http.Status
import datainsider.client.exception.DIException

case class CreateEngineException(message: String, ex: Throwable = null) extends DIException(message, ex) {
  override val reason: String = "create_engine_error"

  override def getStatus: Status = Status.InternalServerError
}
