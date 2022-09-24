package co.datainsider.bi.repository

import co.datainsider.bi.domain.chart.{NumberChartSetting, TableColumn}
import co.datainsider.bi.domain.query.{Sum, TableField}
import co.datainsider.bi.domain.request.ChartRequest
import co.datainsider.bi.domain.response.{SeriesOneItem, SeriesOneResponse}
import co.datainsider.bi.module.TestModule
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import datainsider.client.domain.Implicits.FutureEnhanceLike

class ChartResponseRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()
  private val chartRespRepository = injector.instance[ChartResponseRepository]

  var responseId1 = "key1"
  var responseId2 = "key2"

  test("test save chart response") {
    val chartRequest = ChartRequest(querySetting =
      NumberChartSetting(value =
        TableColumn("Total revenue", Sum(TableField("some_db", "some_tbl", "revenue", "Double")))
      )
    )
    val response = chartRespRepository.queryAndPut(responseId1, chartRequest).syncGet
    assert(response.isInstanceOf[SeriesOneResponse])
  }

  test("test put chart response") {
    val chartResponse = SeriesOneResponse(
      series = Array(SeriesOneItem("hello", Array("data1", "data2", "data3")))
    )
    val ok: Boolean = chartRespRepository.put(responseId2, chartResponse).syncGet
    assert(ok)
  }

  test("test get chart response") {
    val response = chartRespRepository.get(responseId1).syncGet()
    assert(response.isDefined)
    assert(response.get.isInstanceOf[SeriesOneResponse])
  }

  test("test delete response") {
    val deleted = chartRespRepository.delete(responseId1).syncGet()
    assert(deleted)
  }

  test("test multi delete") {
    val deleted = chartRespRepository.multiDelete(Array(responseId2)).syncGet()
    assert(deleted)
  }

}
