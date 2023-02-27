package datainsider.toolscheduler.controller

import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.util.JsonParser
import datainsider.jobscheduler.TestServer
import datainsider.jobscheduler.domain.request.PaginationResponse
import datainsider.toolscheduler.domain.ToolJobHistory
import datainsider.toolscheduler.domain.request.ListToolHistoryRequest

class ToolHistoryControllerTest extends FeatureTest {
  override protected val server = new EmbeddedHttpServer(twitterServer = new TestServer)

  test("test list tool histories") {
    val listToolHistoryRequest = ListToolHistoryRequest("", 0, 10)

    val r = server.httpPost(
      path = "/tool/history/list",
      postBody = JsonParser.toJson(listToolHistoryRequest),
      andExpect = Status.Ok
    )

    val respContent = r.getContentString()
    assert(respContent.nonEmpty)

    val histories = JsonParser.fromJson[PaginationResponse[ToolJobHistory]](respContent)

  }

}
