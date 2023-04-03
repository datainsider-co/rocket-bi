package datainsider.data_cook.pipeline.operator

import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.query.{ObjectQuery, Query}
import datainsider.data_cook.domain.operator.{ExpressionFieldConfiguration, FieldConfiguration, NormalFieldConfiguration, TableConfiguration}
import datainsider.data_cook.pipeline.exception.{InputInvalid, OperatorException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain.TableSchema
import datainsider.profiler.Profiler

import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global

case class ManageFieldOperator(
    id: OperatorId,
    fields: Array[NormalFieldConfiguration],
    destTableConfiguration: TableConfiguration,
    extraFields: Array[ExpressionFieldConfiguration] = Array.empty
) extends TableResultOperator {
  def getActiveFieldConfigs(): Array[FieldConfiguration] = {
    (fields ++: extraFields).filterNot(field => field.isHidden).toArray[FieldConfiguration]
  }

  def toQuery: Query = {
    ObjectQuery(
      functions = getActiveFieldConfigs().map(_.toSelectFunction)
    )
  }
}

case class ManageFieldOperatorExecutor(tableService: EtlTableService) extends Executor[ManageFieldOperator] {

  @throws[OperatorException]
  @throws[InputInvalid]
  override def process(operator: ManageFieldOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

    ensureInput(operator, context.mapResults)
    try {
      val aliasDisplayNames: Array[String] = operator.getActiveFieldConfigs().map(_.displayName)
      val tableSchema: TableSchema = tableService
        .creatView(
          context.orgId,
          context.jobId,
          operator.toQuery,
          operator.destTableConfiguration,
          aliasColumnDisplayNames = aliasDisplayNames
        )
        .syncGet()
      TableResult(operator.id, tableSchema)
    } catch {
      case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
    }

  }

  private def ensureInput(
      operator: ManageFieldOperator,
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for manage field operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing previous result of manage field operator")
    }
  }

}
