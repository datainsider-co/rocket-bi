package datainsider.jobscheduler.repository

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.jobscheduler.module.TestModule
import datainsider.lakescheduler.module.LakeTestModule
import org.scalatest.BeforeAndAfterAll

class SchemaManagerTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector = TestInjector(TestModule, LakeTestModule, SchemaClientModule, MockCaasClientModule).newInstance()

  override def beforeAll(): Unit = {
    val schemaReady = for {
      jobOk <- injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema()
      sourceOk <- injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema()
      historyOk <- injector.instance[SchemaManager](Names.named("history-schema")).ensureSchema()
    } yield jobOk && sourceOk && historyOk
    Await.result(schemaReady)
  }

  test("ensure mysql job repository") {
    val schemaManager: SchemaManager = injector.instance[SchemaManager](Names.named("job-schema"))
    assert(Await.result(schemaManager.ensureSchema()))
  }

  test("test ensure mysql data source repository") {
    val schemaManager: SchemaManager = injector.instance[SchemaManager](Names.named("source-schema"))
    assert(Await.result(schemaManager.ensureSchema()))
  }

  test("test ensure mysql job history repository") {
    val schemaManager: SchemaManager = injector.instance[SchemaManager](Names.named("history-schema"))
    assert(Await.result(schemaManager.ensureSchema()))
  }
}
