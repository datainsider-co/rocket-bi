package co.datainsider.datacook.domain.operator

import co.datainsider.datacook.domain.Ids.OperatorId
import co.datainsider.datacook.domain.persist.ActionConfiguration
import co.datainsider.datacook.pipeline.operator.Operator
import co.datainsider.datacook.util.StringUtils.{findAll, test}
import co.datainsider.schema.misc.ClickHouseUtils.ETL_DATABASE_PATTERN
import com.clearspring.analytics.hash.MurmurHash
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonIgnore, JsonSubTypes, JsonTypeInfo}

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
    new Type(value = classOf[OldGetDataOperator], name = "get_data_operator"),
    new Type(value = classOf[OldJoinOperator], name = "join_operator"),
    new Type(value = classOf[OldTransformOperator], name = "transform_operator"),
    new Type(value = classOf[OldManageFieldOperator], name = "manage_field_operator"),
    new Type(value = classOf[OldPivotTableOperator], name = "pivot_table_operator"),
    new Type(value = classOf[SQLQueryOperator], name = "sql_query_operator"),
    new Type(value = classOf[OldPythonOperator], name = "python_operator"),
    new Type(value = classOf[SendToGroupEmailOperator], name = "send_to_group_email_operator")
  )
)
@deprecated("Use Operator instead", "29/08/2022")
trait OldOperator {

  protected def makeId(keys: String*): OperatorId = {
    MurmurHash.hash(keys.mkString("_")).toString
  }

  def id: OperatorId

  /**
    * Config destination table after process completed
    */
  def destTableConfiguration(): DestTableConfig

  /**
    * Valid a operator correct, if incorrect, throw [InvalidOperatorError]
    */
  def validate(): Unit

  /**
    * get all action of operator
    */
  @JsonIgnore
  def getActionConfigurations(): Array[ActionConfiguration]


  /**
   * @return all tables of this operator, if operator is nested, get all destination tables of nested operator
   */
  @JsonIgnore
  def getDestTableNames(): Set[String]

  /**
   * @return all nested operators of this operator, include itself
   */
  @JsonIgnore
  def getNestedOperators(): Array[OldOperator]

  /**
   * method convert ETLOperator to Operator
   *
   * @param getOperatorId convert etl operator id to operator id
   */
  def toOperator(getOperatorId: OperatorId => Operator.OperatorId): Operator

  /**
   * get all parent operators of this operator. method not recursive
   */
  @JsonIgnore
  def getParentOperators(): Array[OldOperator]
}

/**
  * Config information of output operator
  * @param tblName table name
  * @param dbDisplayName database display name
  * @param tblDisplayName table display name
  */
case class DestTableConfig(
    tblName: String,
    dbDisplayName: String,
    tblDisplayName: String
)

object OldOperator {

  private def isETLDatabase(databaseName: String): Boolean = test(databaseName, ETL_DATABASE_PATTERN)

  def validateDatabaseName(json: String): ValidateDatabaseResult = {
    val invalidDatabaseName = findAll(json, "\"db_name\"\\s*:\\s*\"(\\w+)\"", 1)
      .find(databaseName => !isETLDatabase(databaseName))
    ValidateDatabaseResult(invalidDatabaseName)
  }
}

case class ValidateDatabaseResult(private val invalidDatabaseName: Option[String]) {
  def isInvalid(): Boolean = invalidDatabaseName.isDefined

  def databaseName: String = invalidDatabaseName.getOrElse("")
}
