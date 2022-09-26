package datainsider.data_cook.pipeline.operator

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import datainsider.data_cook.domain.{EtlConfig, IncrementalConfig}
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.pipeline.exception.{InputInvalid, OperatorException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator.persist._

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
    config: EtlConfig,
)

trait Executor[T <: Operator] {

  /**
    * Xử lý operator, lấy parent result để xử lý cho operator hiện tại
    *
    * @param operator operator xử lý hiện tại
    * @param mapResults các result đã được xử lý
    * @return result khi được process
    */
  @throws[OperatorException]
  @throws[InputInvalid]
  def process(operator: T, context: ExecutorContext): OperatorResult
}
