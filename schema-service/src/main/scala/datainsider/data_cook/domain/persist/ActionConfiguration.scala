package datainsider.data_cook.domain.persist

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
}
