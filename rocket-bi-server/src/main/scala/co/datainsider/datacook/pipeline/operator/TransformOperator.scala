package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.chart.{ChartSetting, GroupTableChartSetting, TableChartSetting}
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.schema.domain.TableSchema
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.domain.Implicits.FutureEnhanceLike

import scala.collection.mutable

case class TransformOperator(id: OperatorId, query: GroupTableChartSetting, destTableConfiguration: DestTableConfig)
    extends TableResultOperator {
  def getTableChartSetting(): ChartSetting = {
    TableChartSetting(
      columns = query.columns,
      formatters = query.formatters,
      filters = query.filters,
      sorts = query.sorts,
      sqlViews = query.sqlViews,
      options = query.options
    )
  }

}

case class TransformOperatorExecutor(operatorService: OperatorService) extends Executor[TransformOperator] {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def execute(operator: TransformOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      val tableChartSetting: ChartSetting = operator.getTableChartSetting()
      val result: Future[TableResult] = for {
        tableSchema <- operatorService.createTable(context.orgId, context.jobId, tableChartSetting, operator.destTableConfiguration)
        _ <- operatorService.ingestIfTableEmpty(tableChartSetting, tableSchema)
      } yield TableResult(operator.id, tableSchema)
      result
        .transform {
          case Return(r) => Future.value(r)
          case Throw(ex) => Future.exception(new OperatorException(ex.getMessage, ex))
        }
        .syncGet()
    }

  def ensureInput(operator: TransformOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Unit = {
    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for transform operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for transform operator")
    }
  }

}
