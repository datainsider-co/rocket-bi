package co.datainsider.jobworker.service

import co.datainsider.bi.domain.{ClickhouseConnection, Connection}
import co.datainsider.bi.engine.{ClientManager, Engine}
import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_caas.module.MockCaasModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobworker.module.JobWorkerTestModule
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}

/**
  * created 2023-07-07 4:46 PM
  *
  * @author tvc12 - Thien Vi
  */
abstract class AbstractWorkerTest extends IntegrationTest {
  override protected val injector: Injector =
    TestInjector(
      TestContainerModule,
      MockHadoopFileClientModule,
      MockLakeClientModule,
      MockSchemaClientModule,
      TestModule,
      JobWorkerTestModule,
      MockCaasClientModule,
      MockCaasModule
    ).create

  val connection: Connection = injector.instance[ClickhouseConnection]
  val engine: Engine[Connection] = new ClickhouseEngine(new ClientManager()).asInstanceOf[Engine[Connection]]
}
