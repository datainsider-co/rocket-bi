package co.datainsider.bi.domain

import co.datainsider.bi.domain.AttributeBasedOperator.AttributeBasedOperator
import co.datainsider.bi.domain.query.Condition
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class RlsPolicy(
    policyId: Long = 0L,
    orgId: Long = 0L,
    userIds: Seq[String],
    userAttribute: Option[UserAttribute],
    dbName: String,
    tblName: String,
    conditions: Array[Condition]
) {
  def toRlsCondition(): RlsCondition = {
    RlsCondition(dbName, tblName, conditions)
  }
}

case class RlsCondition(
    dbName: String,
    tblName: String,
    conditions: Seq[Condition]
)

case class UserAttribute(
    key: String,
    values: Seq[String],
    @JsonScalaEnumeration(classOf[UserAttributeOperatorRef]) operator: AttributeBasedOperator
)

object AttributeBasedOperator extends Enumeration {
  type AttributeBasedOperator = Value
  val Equal: AttributeBasedOperator = Value("Equal")
  val NotEqual: AttributeBasedOperator = Value("NotEqual")
  val Contain: AttributeBasedOperator = Value("Contain")
  val NotContain: AttributeBasedOperator = Value("NotContain")
  val IsNull: AttributeBasedOperator = Value("IsNull")
  val IsNotNull: AttributeBasedOperator = Value("IsNotNull")
}

class UserAttributeOperatorRef extends TypeReference[AttributeBasedOperator.type]
