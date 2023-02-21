package datainsider.data_cook.operator

import com.twitter.inject
import com.twitter.inject.Test
import datainsider.client.domain.query.{GroupTableChartSetting, TableColumn}
import datainsider.client.module.MockCaasClientModule
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.domain.persist.PersistentType
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.DataCookTestModule
import datainsider.data_cook.pipeline.ExecutorResolver
import datainsider.data_cook.pipeline.exception.UnsupportedExecutorException
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator._
import datainsider.ingestion.module.TestModule

class ExecutorResolverTest extends Test {
  protected val injector: inject.Injector = DiTestInjector(TestModule, MockCaasClientModule, DataCookTestModule).newInstance()
  val executorResolver: ExecutorResolver = injector.instance[ExecutorResolver]

  test("resolve executor for RootOperator") {
    val executor: Executor[RootOperator] = executorResolver.getExecutor(RootOperator(0))
    assert(executor != null)
    println(s"executor exist ${executor != null}, ${executor.getClass}")
  }

  test("resolve executor for GetOperatorExecutor") {
    val getOperator = GetOperator(0, null, TableConfiguration("table name", "test_table", "test_table"))
    val executor: Executor[GetOperator] = executorResolver.getExecutor(getOperator)
    assert(executor != null)
    println(s"executor exist ${executor != null}, ${executor.getClass}")
  }

  test("resolve executor for TransformOperatorExecutor") {
    val transformOperator = TransformOperator(0, GroupTableChartSetting(columns = Array.empty[TableColumn]), null)
    val executor: Executor[TransformOperator] = executorResolver.getExecutor(transformOperator)
    assert(executor != null)
  }

  test("resolve executor for SaveDwhExecutor") {
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
