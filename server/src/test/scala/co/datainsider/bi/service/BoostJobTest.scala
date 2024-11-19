package co.datainsider.bi.service

import co.datainsider.bi.domain.request.ChartRequest
import co.datainsider.bi.domain.response.{ChartResponse, SeriesOneResponse}
import co.datainsider.bi.module.{TestBIClientModule, TestCommonModule, TestContainerModule, TestModule}
import co.datainsider.bi.repository.ChartResponseRepository
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import co.datainsider.bi.util.Implicits.FutureEnhance

class BoostJobTest extends IntegrationTest {

  override protected def injector: Injector =
    TestInjector(TestModule, TestBIClientModule, TestContainerModule, TestCommonModule).newInstance()
  private val chartRespRepository = injector.instance[ChartResponseRepository]
  private val mockDashboardService = new MockDashboardService
  private val boostJob = new BoostJob(mockDashboardService, chartRespRepository)

  test("test run boost job") {
    boostJob.boost(mockDashboardService.dashboard1)
  }

  test("test get chartResponse after boost job run") {
    val chartRequests: Array[ChartRequest] = mockDashboardService.dashboard1.toChartRequests

    chartRequests
      .map(_.toResponseId)
      .map(responseId => {
        val chartResp: Option[ChartResponse] = chartRespRepository.get(responseId).syncGet
        assert(chartResp.isDefined)
        assert(chartResp.get.isInstanceOf[SeriesOneResponse])

        val seriesOneResponse = chartResp.get.asInstanceOf[SeriesOneResponse]
        assert(seriesOneResponse.lastQueryTime != 0)
        assert(seriesOneResponse.lastProcessingTime != 0)
      })

  }
}
