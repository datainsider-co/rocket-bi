package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.query.SqlQuery
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.schema.domain.TableSchema
import datainsider.client.util.Implicits.FutureEnhance

import scala.collection.mutable

case class SQLOperator(id: OperatorId, query: String, destTableConfiguration: DestTableConfig)
    extends TableResultOperator

case class SQLOperatorExecutor(operatorService: OperatorService) extends Executor[SQLOperator] {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def execute(operator: SQLOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      try {
        val tableSchema: TableSchema = operatorService
          .createViewTable(context.orgId, context.jobId, SqlQuery(operator.query), operator.destTableConfiguration)
          .syncGet()
        TableResult(operator.id, tableSchema)
      } catch {
        case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
      }

    }

  def ensureInput(operator: SQLOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for sql operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for sql operator")
    }

  }

}
