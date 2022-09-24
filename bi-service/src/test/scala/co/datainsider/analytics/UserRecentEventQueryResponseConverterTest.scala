/*
package co.datainsider.analytics

import co.datainsider.analytics.misc.converters.UserRecentEventResponseConverter
import co.datainsider.bi.domain.response.JsonTableResponse
import com.twitter.inject.Test
import datainsider.client.util.JsonParser

import scala.io.Source

class UserRecentEventQueryResponseConverterTest extends Test {

  test("Convert ExcelChartResponse to Events") {
    val data = Source.fromFile("test-data/event_excel_table_chart_response.json", "UTF-8").getLines().mkString("\n")

    val eventDisplayNameMap = Map(
      "di_pageview" -> "PageView"
    )
    val response = JsonParser.fromJson[JsonTableResponse](data)

    val result = UserRecentEventResponseConverter(eventDisplayNameMap).convert(response)

    assertResult(845)(result.total)
    assertResult("di_pageview")(result.data(0).name)
    assertResult("PageView")(result.data(0).displayName)
    assertResult(true)(result.data(0).isSystemEvent)
  }
}
*/
