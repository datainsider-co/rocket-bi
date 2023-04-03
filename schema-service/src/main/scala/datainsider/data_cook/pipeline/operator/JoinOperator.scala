package datainsider.data_cook.pipeline.operator

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.query._
import datainsider.data_cook.domain.operator.JoinType.JoinType
import datainsider.data_cook.domain.operator.{JoinType, JoinTypeRef, TableConfiguration}
import datainsider.data_cook.pipeline.exception.{InputInvalid, OperatorException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain.TableSchema
import datainsider.profiler.Profiler

import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global

case class JoinConfiguration(
    leftId: OperatorId,
    rightId: OperatorId,
    conditions: Array[EqualField],
    @JsonScalaEnumeration(classOf[JoinTypeRef]) joinType: JoinType
)

case class JoinOperator(
    id: OperatorId,
    joinConfigs: Array[JoinConfiguration],
    destTableConfiguration: TableConfiguration
) extends TableResultOperator

case class JoinOperatorExecutor(tableService: EtlTableService, limit: Option[Limit]) extends Executor[JoinOperator] {

  @throws[OperatorException]
  @throws[InputInvalid]
  override def process(operator: JoinOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

    ensureInputs(operator.joinConfigs, context.mapResults)
    try {
      val joinQuery: Query = buildJoinQuery(operator, context.mapResults)
      val tableSchema: TableSchema = tableService.creatView(context.orgId, context.jobId, joinQuery, operator.destTableConfiguration).syncGet()
      TableResult(operator.id, tableSchema)
    } catch {
      case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
    }
  }

  private def buildJoinQuery(operator: JoinOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Query = {
    val joinConditions: Array[JoinCondition] = operator.joinConfigs.map(joinConfig => {
      val leftTable: TableSchema = mapResults(joinConfig.leftId).getData[TableSchema]().get
      val rightTable: TableSchema = mapResults(joinConfig.rightId).getData[TableSchema]().get
      joinConfig.joinType match {
        case JoinType.Left  => LeftJoin(leftTable.toAliasView, rightTable.toAliasView, joinConfig.conditions)
        case JoinType.Right => RightJoin(leftTable.toAliasView, rightTable.toAliasView, joinConfig.conditions)
        case JoinType.Inner => InnerJoin(leftTable.toAliasView, rightTable.toAliasView, joinConfig.conditions)
        case JoinType.FullOuter => FullJoin(leftTable.toAliasView, rightTable.toAliasView, joinConfig.conditions)
      }
    })
    ObjectQuery(
      functions = Seq(SelectAll()),
      joinConditions = joinConditions,
      limit = limit
    )
  }

  @throws[InputInvalid]
  private def ensureInputs(
      joinConfigs: Array[JoinConfiguration],
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {

    joinConfigs.foreach(joinConfig => {
      val leftTable: Option[TableSchema] = mapResults.get(joinConfig.leftId).flatMap(_.getData[TableSchema]())
      if (leftTable.isEmpty) {
        throw InputInvalid("missing left result of join operator")
      }
      val rightTable: Option[TableSchema] = mapResults.get(joinConfig.rightId).flatMap(_.getData[TableSchema]())
      if (rightTable.isEmpty) {
        throw InputInvalid("missing right result of join operator")
      }
    })

  }
}
