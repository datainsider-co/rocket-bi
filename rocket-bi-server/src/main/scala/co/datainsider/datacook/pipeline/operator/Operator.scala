package co.datainsider.datacook.pipeline.operator

import co.datainsider.datacook.domain.EtlConfig
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.persist._
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

import scala.collection.mutable

object Operator {
  type OperatorId = Int
}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[RootOperator], name = "root_operator"),
    new Type(value = classOf[GetOperator], name = "get_data_operator"),
    new Type(value = classOf[JoinOperator], name = "join_operator"),
    new Type(value = classOf[TransformOperator], name = "transform_operator"),
    new Type(value = classOf[ManageFieldOperator], name = "manage_field_operator"),
    new Type(value = classOf[PivotOperator], name = "pivot_operator"),
    new Type(value = classOf[SQLOperator], name = "sql_operator"),
    new Type(value = classOf[PythonOperator], name = "python_operator"),
    new Type(value = classOf[SaveDwhOperator], name = "save_dwh_operator"),
    new Type(value = classOf[SendEmailOperator], name = "send_email_operator"),
    new Type(value = classOf[SendGroupEmailOperator], name = "send_group_email_operator"),
    new Type(value = classOf[OraclePersistOperator], name = "oracle_persist_operator"),
    new Type(value = classOf[PostgresPersistOperator], name = "postgres_persist_operator"),
    new Type(value = classOf[MsSQLPersistOperator], name = "ms_sql_persist_operator"),
    new Type(value = classOf[MySQLPersistOperator], name = "my_sql_persist_operator"),
    new Type(value = classOf[VerticaPersistOperator], name = "vertica_persist_operator")
  )
)
trait Operator {
  val id: OperatorId
  val parentIds: mutable.Buffer[OperatorId] = mutable.ArrayBuffer.empty[OperatorId]

  def addParents(operators: Operator*): Unit = {
    operators.foreach(operator => {
      if (!parentIds.contains(operator.id)) {
        parentIds.append(operator.id)
      }
    })
  }

  override def toString: String = String.valueOf(this.id)

  // Trả ra tên format: ClassName(id)
  def debugName: String = s"${getClass.getSimpleName}(${String.valueOf(this.id)})"
}

/**
  * name of abstract class, for a result of operator can be a table.
  */
trait TableResultOperator extends Operator {
  val destTableConfiguration: DestTableConfig
}

trait OperatorResult {
  val id: OperatorId

  def getData[T]()(implicit manifest: Manifest[T]): Option[T]

  // Trả ra tên format: ClassName(id)
  def debugName: String = s"${getClass.getSimpleName}(${String.valueOf(this.id)})"
}

case class ExecutorContext(
    orgId: OrganizationId,
    jobId: EtlJobId,
    mapResults: mutable.Map[OperatorId, OperatorResult],
    config: EtlConfig
)

trait Executor[T <: Operator] {

  /**
    * Execute operator and return operator result.
    * Get parent operator result from executor context and validate input.
    * @throws OperatorException if execute operator failed
    * @throws InputInvalid if parent operator result is invalid or not found
    */
  @throws[OperatorException]
  @throws[InputInvalid]
  def execute(operator: T, context: ExecutorContext): OperatorResult
}
