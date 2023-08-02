package co.datainsider.datacook.service

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.datacook.domain.request.etl.ListEtlJobsRequest
import co.datainsider.datacook.domain.response.EtlJobHistoryResponse
import co.datainsider.datacook.domain.{ETLStatus, EtlJobHistory}
import co.datainsider.datacook.engine.DiTestInjector
import co.datainsider.datacook.module.{DataCookSqlScriptModule, TestDataCookModule}
import co.datainsider.schema.domain.PageResult
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaTestModule}
import com.twitter.inject.{Injector, IntegrationTest}

/**
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 2:16 PM
  */
class HistoryETLServiceTest extends IntegrationTest {
  private lazy val historyService = injector.instance[HistoryETLService]

  override protected val injector: Injector =
    DiTestInjector(TestModule, TestContainerModule, SchemaTestModule, TestDataCookModule, MockCaasClientModule, MockSchemaClientModule)
      .newInstance()
  val orgId = 123
  val baseRequest = MockUserContext.getLoggedInRequest(orgId, "tvc12")
  var latestHistoryId = 0L

  override def beforeAll(): Unit = {
    super.beforeAll()
    DataCookSqlScriptModule.singletonPostWarmupComplete(injector)
  }

  test("Create history") {
    val result: EtlJobHistory = await(
      historyService.createHistory(
        organizationId = orgId,
        etlId = 1,
        ownerId = "tvc12",
        status = ETLStatus.Queued
      )
    )
    assert(result.etlJobId == 1)
    assert(result.ownerId == "tvc12")
    assert(result.status == ETLStatus.Queued)
    assert(result.id > 0)
    assert(result.organizationId == orgId)
    latestHistoryId = result.id
  }

  test("List History of etl") {
    val request = ListEtlJobsRequest(from = 0, size = 100, request = baseRequest)

    val results: PageResult[EtlJobHistoryResponse] =
      await(historyService.listHistories(organizationId = orgId, request))
    assert(results.total > 0)
    assert(results.data.nonEmpty)
  }

  test("get history of etl") {
    val result: EtlJobHistory = await(historyService.get(organizationId = orgId, id = latestHistoryId))
    assert(result.id == latestHistoryId)
    assert(result.etlJobId == 1)
    assert(result.ownerId == "tvc12")
    assert(result.status == ETLStatus.Queued)
  }

  test("update history of etl") {
    val result = await(
      historyService.update(
        organizationId = orgId,
        jobHistory = EtlJobHistory(
          id = latestHistoryId,
          etlJobId = 1,
          ownerId = "tvc12",
          status = ETLStatus.Running,
          organizationId = orgId,
          totalExecutionTime = 1000
        )
      )
    )

    assert(result.id == latestHistoryId)
    assert(result.etlJobId == 1)
    assert(result.ownerId == "tvc12")
    assert(result.status == ETLStatus.Running)
    assert(result.totalExecutionTime == 1000)
  }
}
