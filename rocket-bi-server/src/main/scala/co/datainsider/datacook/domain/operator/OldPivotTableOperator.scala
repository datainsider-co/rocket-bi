package co.datainsider.datacook.domain.operator

import co.datainsider.bi.domain.chart.PivotTableSetting
import co.datainsider.datacook.domain.Ids.OperatorId
import co.datainsider.datacook.domain.InvalidOperatorError
import co.datainsider.datacook.domain.operator.OldOperator.validateDatabaseName
import co.datainsider.datacook.domain.persist.{
  ActionConfiguration,
  DwhPersistConfiguration,
  EmailConfiguration,
  ThirdPartyPersistConfiguration
}
import co.datainsider.datacook.pipeline.operator.Operator
import com.fasterxml.jackson.annotation.JsonIgnore
import datainsider.client.util.JsonParser

/**
  * operator query data as pivot table basic on previous operator and pivot query
  *
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 11:07 AM
  * @param operator previous operator
  * @param query pivot query setting for query data
  */
@deprecated(message = "Use TransformOperator instead", since = "0.1.0")
case class OldPivotTableOperator(
    operator: OldOperator,
    query: PivotTableSetting,
    destTableConfiguration: DestTableConfig,
    isPersistent: Boolean = false,
    persistConfiguration: Option[DwhPersistConfiguration] = None,
    thirdPartyPersistConfigurations: Array[ThirdPartyPersistConfiguration] = Array.empty,
    emailConfiguration: Option[EmailConfiguration] = None
) extends OldOperator {

  @JsonIgnore
  override def id: OperatorId = {
    val keys: Array[String] = Array(operator.id, destTableConfiguration.tblName)
    makeId(keys: _*)
  }

  private def validate(query: PivotTableSetting): Unit = {
    val json = JsonParser.toJson(query)
    val result = validateDatabaseName(json)
    if (result.isInvalid()) {
      throw InvalidOperatorError(
        s"database: ${result.databaseName} incorrect in operator name: ${destTableConfiguration.tblName}",
        this
      )
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

  override def getDestTableNames(): Set[String] = {
    operator.getDestTableNames() ++ Set(destTableConfiguration.tblName)
  }

  override def getNestedOperators(): Array[OldOperator] = {
    operator.getNestedOperators() ++ Array(this)
  }

  override def toOperator(getOperatorId: OperatorId => Operator.OperatorId): Operator = {
    import co.datainsider.datacook.pipeline.{operator => pipeline}
    val newId: Operator.OperatorId = getOperatorId(id)
    pipeline.PivotOperator(newId, query, destTableConfiguration)
  }

  override def getParentOperators(): Array[OldOperator] = Array(operator)
}
