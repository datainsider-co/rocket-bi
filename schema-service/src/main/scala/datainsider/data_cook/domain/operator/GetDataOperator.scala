package datainsider.data_cook.domain.operator

import com.fasterxml.jackson.annotation.JsonIgnore
import datainsider.data_cook.domain.Ids.OperatorId
import datainsider.data_cook.domain.persist.{ActionConfiguration, DwhPersistConfiguration, EmailConfiguration, ThirdPartyPersistConfiguration}
import datainsider.ingestion.domain.TableSchema

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
case class GetDataOperator(
    tableSchema: TableSchema,
    destTableConfig: Option[TableConfiguration] = None,
    isPersistent: Boolean = false,
    persistConfiguration: Option[DwhPersistConfiguration] = None,
    thirdPartyPersistConfigurations: Array[ThirdPartyPersistConfiguration] = Array.empty,
    emailConfiguration: Option[EmailConfiguration] = None
) extends EtlOperator {

  @JsonIgnore
  override def id: OperatorId = makeId(destTableConfiguration().tblName)

  /**
    * get destTableConfiguration if
    * @return
    */
  def destTableConfiguration(): TableConfiguration = {
    destTableConfig match {
      case Some(config) => config
      case _ =>
        TableConfiguration(
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
}
