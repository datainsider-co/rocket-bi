package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId

case class RootOperator(id: OperatorId) extends Operator

case class RootOperatorResult(id: OperatorId) extends OperatorResult {
  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None
}

case class RootOperatorExecutor() extends Executor[RootOperator] {

  override def execute(operator: RootOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {
      RootOperatorResult(operator.id)
    }
}
