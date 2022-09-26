package datainsider.data_cook.domain.persist

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.persist.PersistentType.PersistentType

/**
  * Thông tin để persist một view xuống thành 1 table trong dwh
 *
 * @param dbName target database name
  * @param tblName target table name
  * @param `type` type persist
  */
case class DwhPersistConfiguration(
    dbName: String,
    tblName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef]) `type`: PersistentType,
    displayName: Option[String] = None
) extends ActionConfiguration {
  /**
   * Valid a action is correct
   */
  override def validate(): Unit = Unit
}

object PersistentType extends Enumeration {
  type PersistentType = Value
  val Replace: PersistentType = Value("Update")
  val Append: PersistentType = Value("Append")
}
class PersistentTypeRef extends TypeReference[PersistentType.type]
