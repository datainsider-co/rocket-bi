package co.datainsider.bi.engine

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.clickhouse.{ClickhouseEngine, DataTable}
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_caas.module.MockCaasModule
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.exception.DbExecuteError

/**
  * created 2023-05-31 4:06 PM
  *
  * @author tvc12 - Thien Vi
  */
class EngineResolverTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockCaasModule, TestContainerModule, MockSchemaClientModule).newInstance()

  private val clickhouseSource = injector.instance[ClickhouseConnection]
  val clientPool = new ClientManager()
  val clickhouseEngine: ClickhouseEngine = new ClickhouseEngine(clientPool)

  test("test connection success") {
    val isSuccess: Boolean = await(clickhouseEngine.testConnection(clickhouseSource))
    assert(isSuccess)
  }

  test("test connection failure") {
    assertThrows[DbExecuteError](await(clickhouseEngine.testConnection(clickhouseSource.copy(host = "wrong host"))))
  }

  test("test execute query with 10 thread") {
    val query = "select 1 as id, 'tvc12' as name"
    val threads = Range(0, 10).map(_ => {
      val thread = new Thread {
        override def run(): Unit = {
          println(s"thread: ${Thread.currentThread().getName} start")
          val table: DataTable = await(clickhouseEngine.execute(clickhouseSource, sql = query))
          assert(table.headers.length == 2)
          assert(table.records.length == 1)
          println(s"thread: ${Thread.currentThread().getName} completed")
        }
      }
      thread.start()
      thread
    })
    threads.foreach(_.join())
    assert(clientPool.getClientSize() == 1)
  }
}
