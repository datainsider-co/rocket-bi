package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.query._
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.operator.JoinType.JoinType
import co.datainsider.datacook.domain.operator.{DestTableConfig, JoinType, JoinTypeRef}
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.schema.domain.TableSchema
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.Implicits.FutureEnhanceLike

import scala.collection.mutable

case class JoinConfiguration(
    leftId: OperatorId,
    rightId: OperatorId,
    conditions: Array[EqualField],
    @JsonScalaEnumeration(classOf[JoinTypeRef]) joinType: JoinType
)

case class JoinOperator(
    id: OperatorId,
    joinConfigs: Array[JoinConfiguration],
    destTableConfiguration: DestTableConfig
) extends TableResultOperator

case class JoinOperatorExecutor(operatorService: OperatorService, limit: Option[Limit] = None)
    extends Executor[JoinOperator] {

  @throws[OperatorException]
  @throws[InputInvalid]
  override def execute(operator: JoinOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInputs(operator.joinConfigs, context.mapResults)
      try {
        val joinQuery: Query = buildJoinQuery(operator, context.mapResults)
        val tableSchema: TableSchema =
          operatorService
            .createViewTable(context.orgId, context.jobId, joinQuery, operator.destTableConfiguration)
            .syncGet()
        TableResult(operator.id, tableSchema)
      } catch {
        case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
      }
    }

  private def buildJoinQuery(operator: JoinOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Query = {
    val joinConditions: Array[JoinCondition] = operator.joinConfigs.map(joinConfig => {
      val leftTable: TableSchema = mapResults(joinConfig.leftId).getData[TableSchema]().get
      val rightTable: TableSchema = mapResults(joinConfig.rightId).getData[TableSchema]().get
      val joinConditions: Array[EqualField] = enhanceJoinConditions(joinConfig.conditions, leftTable, rightTable)
      val leftView = TableView(leftTable.dbName, leftTable.name, aliasViewName = Some(leftTable.name))
      val rightView = TableView(rightTable.dbName, rightTable.name, aliasViewName = Some(rightTable.name))

      joinConfig.joinType match {
        case JoinType.Left      => LeftJoin(leftView, rightView, joinConditions)
        case JoinType.Right     => RightJoin(leftView, rightView, joinConditions)
        case JoinType.Inner     => InnerJoin(leftView, rightView, joinConditions)
        case JoinType.FullOuter => FullJoin(leftView, rightView, joinConditions)
        case _ @join            => throw new UnsupportedOperationException(s"${join.getClass.getSimpleName} not supported yet")
      }
    })
    ObjectQuery(
      functions = Seq(SelectAll()),
      joinConditions = joinConditions,
      limit = limit
    )
  }

  private def enhanceJoinConditions(
      joinConditions: Array[EqualField],
      leftTable: TableSchema,
      rightTable: TableSchema
  ): Array[EqualField] = {
    joinConditions.map(joinCondition => {
      val leftField: Field = joinCondition.leftField.customCopy(aliasViewName = leftTable.name)
      val rightField: Field = joinCondition.rightField.customCopy(aliasViewName = rightTable.name)
      EqualField(
        leftField = leftField,
        rightField = rightField,
        leftScalarFunction = joinCondition.leftScalarFunction,
        rightScalarFunction = joinCondition.rightScalarFunction
      )
    })
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
