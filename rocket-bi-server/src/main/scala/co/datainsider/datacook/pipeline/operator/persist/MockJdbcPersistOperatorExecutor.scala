package co.datainsider.datacook.pipeline.operator.persist
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.pipeline.exception.InputInvalid
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.{Executor, ExecutorContext, OperatorResult}
import co.datainsider.schema.domain.TableSchema

import scala.collection.mutable
case class MockJdbcPersistOperatorExecutor() extends Executor[JdbcPersistOperator] {

  override def execute(operator: JdbcPersistOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      JdbcPersistResult(operator.id, 0, 0)

    }

  @throws[InputInvalid]
  private def ensureInput(
      operator: JdbcPersistOperator,
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for jdbc persist operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing previous result of jdbc persist operator")
    }
  }

}
