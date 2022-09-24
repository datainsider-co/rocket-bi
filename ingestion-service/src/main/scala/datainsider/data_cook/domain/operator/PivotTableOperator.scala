package datainsider.data_cook.domain.operator

import com.fasterxml.jackson.annotation.JsonIgnore
import datainsider.client.domain.query.{GroupTableChartSetting, PivotTableSetting}
import datainsider.client.util.JsonParser
import datainsider.data_cook.domain.Ids.OperatorId
import datainsider.data_cook.domain.InvalidOperatorError
import datainsider.data_cook.domain.operator.EtlOperator.{isEtlDatabase, validateDatabaseName}
import datainsider.data_cook.domain.persist.{ActionConfiguration, DwhPersistConfiguration, EmailConfiguration, ThirdPartyPersistConfiguration}

/**
  * operator query data as pivot table basic on previous operator and pivot query
  *
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 11:07 AM
  * @param operator previous operator
  * @param query pivot query setting for query data
  */
case class PivotTableOperator(
    operator: EtlOperator,
    query: PivotTableSetting,
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

  private def validate(query: PivotTableSetting): Unit = {
    val json = JsonParser.toJson(query)
    val result = validateDatabaseName(json)
    if (result.isInvalid()) {
      throw InvalidOperatorError(s"database: ${result.databaseName} incorrect in operator name: ${destTableConfiguration.tblName}", this)
    }
  }

  /**
   * Valid a operator correct
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
