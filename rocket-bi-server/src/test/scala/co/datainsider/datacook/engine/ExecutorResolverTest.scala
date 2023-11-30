package co.datainsider.datacook.engine

import co.datainsider.bi.domain.chart.{GroupTableChartSetting, TableColumn}
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.domain.persist.PersistentType
import co.datainsider.datacook.pipeline.exception.UnsupportedExecutorException
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl}
import com.twitter.inject.Test

class ExecutorResolverTest extends Test {
  val executorResolver: ExecutorResolver = new ExecutorResolverImpl()

  test("resolve executor for RootOperator") {
    executorResolver.register(RootOperatorExecutor())
    val executor: Executor[RootOperator] = executorResolver.getExecutor(RootOperator(0))
    assert(executor != null)
    println(s"executor exist ${executor != null}, ${executor.getClass}")
  }

  test("resolve executor for GetOperatorExecutor") {
    executorResolver.register(GetOperatorExecutor(null, null))
    val getOperator = GetOperator(0, null, DestTableConfig("table name", "test_table", "test_table"))
    val executor: Executor[GetOperator] = executorResolver.getExecutor(getOperator)
    assert(executor != null)
    println(s"executor exist ${executor != null}, ${executor.getClass}")
  }

  test("resolve executor for TransformOperatorExecutor") {
    executorResolver.register(TransformOperatorExecutor(null))
    val transformOperator = TransformOperator(0, GroupTableChartSetting(columns = Array.empty[TableColumn]), null)
    val executor: Executor[TransformOperator] = executorResolver.getExecutor(transformOperator)
    assert(executor != null)
  }

  test("resolve executor for SaveDwhExecutor") {
    executorResolver.register(SaveDwhOperatorExecutor(null, null, null))
    val saveDwhOperator = SaveDwhOperator(0, "test", "123", PersistentType.Append)
    val executor: Executor[SaveDwhOperator] = executorResolver.getExecutor(saveDwhOperator)
    assert(executor != null)
    println(s"executor exist ${executor != null}, ${executor.getClass}")
  }

  test("get unsupported executor") {
    case class UnknownOperator(override val id: OperatorId) extends Operator
    var passTest = false
    try {
      val executor = executorResolver.getExecutor(UnknownOperator(0))
      passTest = false
    } catch {
      case ex: UnsupportedExecutorException => passTest = true
      case ex: Throwable                    => passTest = false
    }

    assert(passTest)
  }
}
