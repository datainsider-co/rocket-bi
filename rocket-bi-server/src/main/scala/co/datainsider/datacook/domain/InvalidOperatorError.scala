package co.datainsider.datacook.domain

import com.twitter.finagle.http.Status
import datainsider.client.exception.{DIErrorReason, DIException}
import co.datainsider.datacook.domain.operator.OldOperator

/**
  * @author tvc12 - Thien Vi
  * @created 10/11/2021 - 8:35 PM
  */
case class InvalidOperatorError(message: String, operator: OldOperator, cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason: String = DIErrorReason.InternalError

  override def getStatus: Status = Status.InternalServerError
}
