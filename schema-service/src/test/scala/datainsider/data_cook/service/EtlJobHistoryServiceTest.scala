package datainsider.data_cook.service

import com.twitter.finagle.http.{Request, RequestBuilder}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.MockCaasClientModule
import datainsider.data_cook.domain.MockData.mockHistoryData
import datainsider.data_cook.domain.request.EtlRequest.ListEtlJobsRequest
import datainsider.data_cook.domain.response.EtlJobHistoryResponse
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.DataCookTestModule
import datainsider.ingestion.domain.PageResult
import datainsider.ingestion.module.TestModule

/**
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 2:16 PM
  */
class EtlJobHistoryServiceTest extends IntegrationTest {
  private lazy val historyService = injector.instance[EtlJobHistoryService]

  override protected val injector: Injector = DiTestInjector(DataCookTestModule, TestModule, MockCaasClientModule).newInstance()

  test("List History of etl") {
    // cannot new request list history
//    val request = ListEtlJobsRequest(from = 0, size = 100)

//    val results: PageResult[EtlJobHistoryResponse] = await(historyService.listHistories(organizationId = 1, request))
//
//    assertResult(mockHistoryData)(results)
  }
}
