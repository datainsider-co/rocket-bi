package datainsider.data_cook.domain.operator

import com.clearspring.analytics.hash.MurmurHash
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonIgnore, JsonSubTypes, JsonTypeInfo}
import datainsider.data_cook.domain.Ids.OperatorId
import datainsider.data_cook.domain.persist.ActionConfiguration
import datainsider.data_cook.util.StringUtils.{findAll, test}
import datainsider.ingestion.domain.Types.TblName
import datainsider.ingestion.util.ClickHouseUtils.ETL_DATABASE_PATTERN

import scala.collection.mutable.ArrayBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 3:56 PM
  */

/**
  * Biểu thị cho các phép transform như Join, Manage Fields, ...
  *
  *  Kết quả khi chạy EtlOperator sẽ cho ra 1 table
  *
  *  Các EtlOperator có thể dùng EtlOperator kết hợp với nhau để tạo ra table
  */
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[GetDataOperator], name = "get_data_operator"),
    new Type(value = classOf[JoinOperator], name = "join_operator"),
    new Type(value = classOf[TransformOperator], name = "transform_operator"),
    new Type(value = classOf[ManageFieldOperator], name = "manage_field_operator"),
    new Type(value = classOf[PivotTableOperator], name = "pivot_table_operator"),
    new Type(value = classOf[SQLQueryOperator], name = "sql_query_operator"),
    new Type(value = classOf[SendToGroupEmailOperator], name = "send_to_group_email_operator"),
  )
)
@deprecated("Use Operator instead", "29/08/2022")
trait EtlOperator {

  protected def makeId(keys: String*): OperatorId ={
    MurmurHash.hash(keys.mkString("_")).toString
  }

  def id: OperatorId

  /**
    * Config destination table after process completed
    */
  def destTableConfiguration(): TableConfiguration

  /**
   * Valid a operator correct, if incorrect, throw [InvalidOperatorError]
   */
  def validate(): Unit

  /**
   * get all action of operator
   */
  @JsonIgnore
  def getActionConfigurations(): Array[ActionConfiguration]
}

/**
  * Config information of output operator
  * @param tblName table name
  * @param dbDisplayName database display name
  * @param tblDisplayName table display name
  */
case class TableConfiguration(
    tblName: String,
    dbDisplayName: String,
    tblDisplayName: String
)

object EtlOperator {

  private def isEtlDatabase(databaseName: String): Boolean = test(databaseName, ETL_DATABASE_PATTERN)

  def validateDatabaseName(json: String): ValidateDatabaseResult = {
    val invalidDatabaseName = findAll(json, "\"db_name\"\\s*:\\s*\"(\\w+)\"", 1)
      .find(databaseName => !isEtlDatabase(databaseName))
    ValidateDatabaseResult(invalidDatabaseName)
  }

  def getDestTables(operator: EtlOperator): ArrayBuffer[TblName] = {
    operator match {
      case getDataOperator: GetDataOperator => ArrayBuffer(getDataOperator.destTableConfiguration().tblName)
      case transformOperator: TransformOperator => {
        val nestedTables = getDestTables(transformOperator.operator)
        nestedTables.append(transformOperator.destTableConfiguration.tblName)
        nestedTables
      }
      case pivotTableOperator: PivotTableOperator => {
        val nestedTables = getDestTables(pivotTableOperator.operator)
        nestedTables.append(pivotTableOperator.destTableConfiguration.tblName)
        nestedTables
      }
      case sqlQueryOperator: SQLQueryOperator => {
        val nestedTables = getDestTables(sqlQueryOperator.operator)
        nestedTables.append(sqlQueryOperator.destTableConfiguration.tblName)
        nestedTables
      }
      case joinOperator: JoinOperator => {
        val nestedTables = getDestTables(joinOperator.joinConfigs)
        nestedTables.append(joinOperator.destTableConfiguration.tblName)
        nestedTables
      }
      case manageFieldOperator: ManageFieldOperator => {
        val nestedTables = getDestTables(manageFieldOperator.operator)
        nestedTables.append(manageFieldOperator.destTableConfiguration.tblName)
        nestedTables
      }
    }
  }

  private def getDestTables(joinConfigs: Array[JoinConfig]): ArrayBuffer[TblName] = {
    val allTables = ArrayBuffer[TblName]()
    joinConfigs.foreach(config => {
      allTables.appendAll(getDestTables(config.leftOperator))
      allTables.appendAll(getDestTables(config.rightOperator))
    })
    allTables
  }
}

case class ValidateDatabaseResult(private val invalidDatabaseName: Option[String]) {
  def isInvalid(): Boolean = invalidDatabaseName.isDefined

  def databaseName: String = invalidDatabaseName.getOrElse("")
}
