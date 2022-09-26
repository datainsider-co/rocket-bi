package datainsider.data_cook.domain.operator

import com.fasterxml.jackson.annotation.JsonIgnore
import datainsider.client.domain.query.GroupTableChartSetting
import datainsider.client.util.JsonParser
import datainsider.data_cook.domain.Ids.OperatorId
import datainsider.data_cook.domain.InvalidOperatorError
import datainsider.data_cook.domain.operator.EtlOperator.{isEtlDatabase, validateDatabaseName}
import datainsider.data_cook.domain.persist.{ActionConfiguration, DwhPersistConfiguration, EmailConfiguration, ThirdPartyPersistConfiguration}

/**
  * Operator tạo ra 1 table từ câu query trên kết quả của operator trước đó.. Kết quả trả ra là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 3:00 PM
  * @param operator là operator dùng để tạo ra table
  * @param query get data từ operator
  */
case class TransformOperator(
    operator: EtlOperator,
    query: GroupTableChartSetting,
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

  private def validate(query: GroupTableChartSetting): Unit = {
    val json = JsonParser.toJson(query)
    val result = validateDatabaseName(json)
    if (result.isInvalid()) {
      throw InvalidOperatorError(s"database: ${result.databaseName} incorrect in operator name: ${destTableConfiguration.tblName}", this)
    }
  }

  /**
   * Valid a operator correct, if incorrect, throw [InvalidOperatorError]
   */
  override def validate(): Unit = {
    operator.validate()
    validate(query)
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
