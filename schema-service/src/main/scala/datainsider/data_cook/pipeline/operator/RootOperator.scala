package datainsider.data_cook.pipeline.operator

import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

case class RootOperator(id: OperatorId) extends Operator

case class RootOperatorResult(id: OperatorId) extends OperatorResult {
  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None
}

case class RootOperatorExecutor() extends Executor[RootOperator] {

  override def process(operator: RootOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {
    RootOperatorResult(operator.id)
  }
}
