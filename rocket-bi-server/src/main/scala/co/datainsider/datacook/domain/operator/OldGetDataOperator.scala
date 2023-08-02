package co.datainsider.datacook.domain.operator

import co.datainsider.datacook.domain.Ids.OperatorId
import co.datainsider.datacook.domain.persist.{ActionConfiguration, DwhPersistConfiguration, EmailConfiguration, ThirdPartyPersistConfiguration}
import co.datainsider.datacook.pipeline.operator.{GetOperator, Operator}
import co.datainsider.schema.domain.TableSchema
import com.fasterxml.jackson.annotation.JsonIgnore

/**
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 2:45 PM
  */

/**
  * Get data từ một table
  * @param tableSchema chứa thông tin đầy đủ để có thể query data
  * @param destTableConfig chứa thông tin khi đích khi chạy operator này
  *                    Nếu không có thì dest table có tên lấy từ table schema
  */
@deprecated("Use GetOperator instead", "1.0")
case class OldGetDataOperator(
    tableSchema: TableSchema,
    destTableConfig: Option[DestTableConfig] = None,
    isPersistent: Boolean = false,
    persistConfiguration: Option[DwhPersistConfiguration] = None,
    thirdPartyPersistConfigurations: Array[ThirdPartyPersistConfiguration] = Array.empty,
    emailConfiguration: Option[EmailConfiguration] = None
) extends OldOperator {

  @JsonIgnore
  override def id: OperatorId = makeId(destTableConfiguration().tblName)

  /**
    * get destTableConfiguration if
    * @return
    */
  def destTableConfiguration(): DestTableConfig = {
    destTableConfig match {
      case Some(config) => config
      case _ =>
        DestTableConfig(
          tblName = tableSchema.name,
          dbDisplayName = tableSchema.dbName,
          tblDisplayName = tableSchema.displayName
        )
    }
  }

  /**
    * Valid a operator correct
    */
  override def validate(): Unit = {
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
    Set(destTableConfiguration().tblName)
  }

  override def getNestedOperators(): Array[OldOperator] = {
    Array(this)
  }

  override def toOperator(getOperatorId: OperatorId => Operator.OperatorId): Operator = {
    val newId: Operator.OperatorId = getOperatorId(id)
    GetOperator(newId, tableSchema, destTableConfiguration())
  }

  override def getParentOperators(): Array[OldOperator] = Array.empty
}
