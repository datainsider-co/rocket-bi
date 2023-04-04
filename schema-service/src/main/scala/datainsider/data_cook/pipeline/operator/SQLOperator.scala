package datainsider.data_cook.pipeline.operator

import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.query.SqlQuery
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.pipeline.exception.{InputInvalid, OperatorException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain.TableSchema
import datainsider.profiler.Profiler

import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global

case class SQLOperator(id: OperatorId, query: String, destTableConfiguration: TableConfiguration) extends TableResultOperator

case class SQLOperatorExecutor(tableService: EtlTableService) extends Executor[SQLOperator] {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def process(operator: SQLOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

    ensureInput(operator, context.mapResults)
    try {
      val tableSchema: TableSchema = tableService.creatView(context.orgId, context.jobId, SqlQuery(operator.query), operator.destTableConfiguration).syncGet()
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
