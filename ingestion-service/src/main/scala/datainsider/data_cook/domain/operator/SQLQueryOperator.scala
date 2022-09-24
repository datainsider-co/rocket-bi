package datainsider.data_cook.domain.operator

import com.fasterxml.jackson.annotation.JsonIgnore
import datainsider.data_cook.domain.Ids.OperatorId
import datainsider.data_cook.domain.persist.{ActionConfiguration, DwhPersistConfiguration, EmailConfiguration, ThirdPartyPersistConfiguration}

/**
  * Cho phép query 1 table trên operator cho trước. Kết quả là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 10:39 AM
  * @param operator Operator trước đó
  */
case class SQLQueryOperator(
    operator: EtlOperator,
    query: String,
    destTableConfiguration: TableConfiguration,
    isPersistent: Boolean = false,
    persistConfiguration: Option[DwhPersistConfiguration] = None,
    thirdPartyPersistConfigurations: Array[ThirdPartyPersistConfiguration] = Array.empty,
    emailConfiguration: Option[EmailConfiguration] = None
) extends EtlOperator {

  @JsonIgnore
  override def id: OperatorId = {
    val keys: Array[String] = Array(operator.id, destTableConfiguration.tblName)
    makeId(keys: _*)
  }

  /**
   * Valid a operator correct, if incorrect, throw [InvalidOperatorError]
   */
  override def validate(): Unit = {
    operator.validate()
    getActionConfigurations().foreach(_.validate())
  }

  /**
   * get all action of operator
   */
  override def getActionConfigurations(): Array[ActionConfiguration] = {
    val actions = persistConfiguration ++ thirdPartyPersistConfigurations ++ emailConfiguration
    actions.toArray
  }
}
