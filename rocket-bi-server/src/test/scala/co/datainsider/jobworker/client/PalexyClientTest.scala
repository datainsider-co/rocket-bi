package co.datainsider.jobworker.client

import co.datainsider.jobscheduler.util.JsonUtils
import co.datainsider.jobworker.client.palexy.{PalexyClient, PalexyClientImpl}
import com.twitter.inject.Test
import datainsider.client.exception.InternalError

import java.sql.Date

/**
  * created 2023-07-11 3:09 PM
  *
  * @author tvc12 - Thien Vi
  */
class PalexyClientTest extends Test {
  val client: PalexyClient = new PalexyClientImpl(new HttpClientImpl("https://ica.palexy.com"))
  test("get store report") {
    // pending this test because don't have api key
    pending
    val apiKey = ""
    val response = client.getStoreReport(
      apiKey = apiKey,
      metrics = Set("visits", "walk_ins", "average_dwell_time"),
      dimensions = Set("store_id", "store_code", "store_name", "day"),
      fromDate = Date.valueOf("2023-07-01"),
      toDate = Date.valueOf("2023-07-01")
    )
    println(s"palexy response: ${JsonUtils.toJson(response)}")
  }

  test("get store report with wrong api key") {
    val apiKey = "error_api_key"
    assertThrows[HttpClientError] {
      client.getStoreReport(
        apiKey = apiKey,
        metrics = Set("visits", "walk_ins", "average_dwell_time"),
        dimensions = Set("store_id", "store_code", "store_name", "day"),
        fromDate = Date.valueOf("2023-07-01"),
        toDate = Date.valueOf("2023-07-01")
      )
    }
  }

}
