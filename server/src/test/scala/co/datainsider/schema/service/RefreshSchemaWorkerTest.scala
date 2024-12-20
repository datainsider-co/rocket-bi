package co.datainsider.schema.service

import co.datainsider.bi.domain.{BigQueryConnection, ClickhouseConnection}
import co.datainsider.bi.engine.bigquery.BigQueryEngineFactory
import co.datainsider.bi.engine.clickhouse.ClickhouseEngineFactory
import co.datainsider.bi.module.{TestBIClientModule, TestCommonModule, TestContainerModule, TestModule}
import co.datainsider.bi.service
import co.datainsider.bi.service.MockEngineService
import co.datainsider.bi.util.Using
import co.datainsider.caas.user_caas.module.MockCaasModule
import co.datainsider.schema.module.SchemaTestModule
import co.datainsider.schema.repository.SchemaMetadataStorage
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

/**
  * created 2023-06-01 4:12 PM
  *
  * @author tvc12 - Thien Vi
  */
class RefreshSchemaWorkerTest extends IntegrationTest {
  override protected val injector: Injector =
    TestInjector(TestContainerModule, TestModule, MockCaasModule, SchemaTestModule, TestBIClientModule, TestCommonModule).create
  val orgId = 1
  val storage = injector.instance[SchemaMetadataStorage]
//  val worker = new RefreshSchemaWorkerImpl(resolver, storage)
  val source: ClickhouseConnection = injector.instance[ClickhouseConnection]
  val clickhouseCreator = new ClickhouseEngineFactory()

  val bigQuerySource = injector.instance[BigQueryConnection]
  val bigQueryEngineCreator = new BigQueryEngineFactory()

  test("test run with failure") {
    val orgId = 1L
    var finalStage: RefreshSchemaStage = RefreshSchemaStage(orgId, name = "")
    val engineService = service.MockEngineService(clickhouseCreator.create(source.copy(host = "fake-host")))
    val worker = new RefreshSchemaWorkerImpl(engineService, storage)
    worker.run(
      orgId,
      report = (stage: RefreshSchemaStage) => {
        println(s"orgId: $orgId, status: $stage")
        finalStage = stage
      }
    )
    assert(finalStage.status == StageStatus.Error)
    assert(finalStage.name == StageName.Completed)
  }

  test("[Clickhouse] test run with success") {
    val orgId = 0
    var finalStage: RefreshSchemaStage = RefreshSchemaStage(orgId, name = "")
    Using(clickhouseCreator.create(source)) {
        engine => {
          val engineService = service.MockEngineService(engine)
          val worker = new RefreshSchemaWorkerImpl(engineService, storage)
          worker.run(
            orgId,
            report = (stage: RefreshSchemaStage) => {
              println(s"orgId: $orgId, status: $stage")
              finalStage = stage
            }
          )
          assert(finalStage.name == StageName.Completed)
          assert(finalStage.status == StageStatus.Success)
        }
    }

  }

  test("[Clickhouse] test run 2 with success") {
    val orgId = 0
    var finalStage: RefreshSchemaStage = RefreshSchemaStage(orgId, name = "")
    Using(clickhouseCreator.create(source)) {
      engine => {
        val engineService = service.MockEngineService(engine)
        val worker = new RefreshSchemaWorkerImpl(engineService, storage)
        worker.run(
          orgId,
          report = (stage: RefreshSchemaStage) => {
            println(s"[Clickhouse] test run 2:: orgId: $orgId, status: $stage")
            finalStage = stage
          }
        )
        assert(finalStage.name == StageName.Completed)
        assert(finalStage.status == StageStatus.Success)
      }
    }
  }

  test("[BigQuery] test run with success") {
    val orgId = 2L
    var finalStage: RefreshSchemaStage = RefreshSchemaStage(orgId, name = "")
    val engineService = service.MockEngineService(bigQueryEngineCreator.create(bigQuerySource.copy(projectId = "di-insider")))
    val worker = new RefreshSchemaWorkerImpl(engineService, storage)
    worker.run(
      orgId,
      report = (stage: RefreshSchemaStage) => {
        println(s"orgId: $orgId, status: $stage")
        finalStage = stage
      }
    )
    assert(finalStage.name == StageName.Completed)
    assert(finalStage.status == StageStatus.Success)
  }

//  test("test wait stop with worker not running") {
//    val orgId = 1L
//    val startTime = System.currentTimeMillis()
//    worker.waitStop(orgId, timeoutMs = 1000)
//    val endTime = System.currentTimeMillis()
//    assert(endTime - startTime < 1000)
//    println(s"Time: ${endTime - startTime}")
//  }

  test("test wait stop with worker running in thread") {
    val orgId = 1L
    val startTime = System.currentTimeMillis()
    var finalStage: RefreshSchemaStage = RefreshSchemaStage(orgId, name = "")
    Using(clickhouseCreator.create(source)) {
      engine => {
        val engineService = service.MockEngineService(engine)
        val worker = new RefreshSchemaWorkerImpl(engineService, storage)
        new Thread(() => {
          worker.run(
            orgId,
            report = (stage: RefreshSchemaStage) => {
              println(s"orgId: $orgId, status: $stage")
              finalStage = stage
            }
          )
        }).start()
        Thread.sleep(100)
        worker.waitStop(orgId, timeoutMs = 10000)
        val endTime = System.currentTimeMillis()
        assert(endTime - startTime < 10000)
        println(s"Time: ${endTime - startTime}")
        assert(finalStage.name == StageName.Completed)
        assert(finalStage.status == StageStatus.Terminated)
      }
    }

  }

  private def handleReport(stage: RefreshSchemaStage): Unit = {
    println(s"orgId: $orgId, status: $stage")
  }
}
