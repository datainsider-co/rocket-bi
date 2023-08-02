package co.datainsider.datacook.domain.operator

import co.datainsider.datacook.domain.Ids.OperatorId
import co.datainsider.datacook.domain.persist.{
  ActionConfiguration,
  DwhPersistConfiguration,
  EmailConfiguration,
  ThirdPartyPersistConfiguration
}
import co.datainsider.datacook.pipeline.operator.Operator
import com.fasterxml.jackson.annotation.JsonIgnore

@deprecated("use PythonOperator instead")
case class OldPythonOperator(
    operator: OldOperator,
    code: String,
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

  override def getDestTableNames(): Set[String] = {
    operator.getDestTableNames() ++ Set(destTableConfiguration.tblName)
  }

  override def getNestedOperators(): Array[OldOperator] = {
    operator.getNestedOperators() ++ Array(this)
  }

  override def toOperator(getOperatorId: OperatorId => Operator.OperatorId): Operator = {
    val newId: Operator.OperatorId = getOperatorId(id)
    import co.datainsider.datacook.pipeline.{operator => pipeline}
    pipeline.PythonOperator(newId, code, destTableConfiguration)
  }

  override def getParentOperators(): Array[OldOperator] = Array(operator)
}
