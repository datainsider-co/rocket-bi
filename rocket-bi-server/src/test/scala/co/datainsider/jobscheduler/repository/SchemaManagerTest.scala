package co.datainsider.jobscheduler.repository

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class SchemaManagerTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()

  override def beforeAll(): Unit = {
    val schemaReady = for {
      jobOk <- injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema()
      sourceOk <- injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema()
      historyOk <- injector.instance[SchemaManager](Names.named("history-schema")).ensureSchema()
    } yield jobOk && sourceOk && historyOk
    await(schemaReady)
  }

  test("ensure mysql job repository") {
    val schemaManager: SchemaManager = injector.instance[SchemaManager](Names.named("job-schema"))
    assert(await(schemaManager.ensureSchema()))
  }

  test("test ensure mysql data source repository") {
    val schemaManager: SchemaManager = injector.instance[SchemaManager](Names.named("source-schema"))
    assert(await(schemaManager.ensureSchema()))
  }

  test("test ensure mysql job history repository") {
    val schemaManager: SchemaManager = injector.instance[SchemaManager](Names.named("history-schema"))
    assert(await(schemaManager.ensureSchema()))
  }
}
