package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.chart.PivotTableSetting
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.schema.domain.TableSchema
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.domain.Implicits.FutureEnhanceLike

import scala.collection.mutable

case class PivotOperator(id: OperatorId, query: PivotTableSetting, destTableConfiguration: DestTableConfig)
    extends TableResultOperator

case class PivotOperatorExecutor(operatorService: OperatorService) extends Executor[PivotOperator] {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def execute(operator: PivotOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {
      ensureInput(operator, context.mapResults)
      val result: Future[TableResult] = for {
        tableSchema <-
          operatorService.createTable(context.orgId, context.jobId, operator.query, operator.destTableConfiguration)
        _ <- operatorService.ingestIfTableEmpty(tableSchema, operator.query)
      } yield TableResult(operator.id, tableSchema)
      result
        .transform {
          case Return(r) => Future.value(r)
          case Throw(ex) => Future.exception(new OperatorException(ex.getMessage, ex))
        }
        .syncGet()
    }

  private def ensureInput(operator: PivotOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Unit = {
    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for pivot operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for pivot operator")
    }
  }

}
