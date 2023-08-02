package co.datainsider.datacook.domain.persist

import co.datainsider.datacook.pipeline.operator.Operator
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId

/**
  * @author tvc12 - Thien Vi
  * @created 02/24/2022 - 2:59 PM
  */
trait ActionConfiguration {
  def displayName: Option[String]

  /**
    * Valid a action is correct
    */
  def validate(): Unit

  /**
   * method convert action to operator
   *
   * @param id of operator
   * @return
   */
  def toOperator(id: OperatorId): Operator
}
