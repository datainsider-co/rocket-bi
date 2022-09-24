package datainsider.data_cook.domain

import com.twitter.finagle.http.Status
import datainsider.client.exception.{DIErrorReason, DIException}
import datainsider.data_cook.domain.operator.EtlOperator

/**
 * @author tvc12 - Thien Vi
 * @created 10/11/2021 - 8:35 PM
 */
case class InvalidOperatorError(message: String, operator: EtlOperator, cause: Throwable = null)
  extends DIException(message, cause) {
  override val reason: String = DIErrorReason.InternalError

  override def getStatus: Status = Status.InternalServerError
}
