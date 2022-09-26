package datainsider.ingestion.controller

import com.twitter.finagle.http.{Response, Status}
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.ingestion.domain.ClickhouseSource
import datainsider.client.util.JsonParser
import datainsider.ingestion.TestServer
import datainsider.ingestion.controller.http.requests.{TestConnectionRequest}
import datainsider.ingestion.controller.http.responses.TestConnectionResponse
import datainsider.ingestion.domain.SystemInfo

class SystemControllerTest extends FeatureTest {
  override val server = new EmbeddedHttpServer(new TestServer)

  test("Get System Info") {
    val response: Response = server.httpGet("/databases/system/info", andExpect = Status.Ok)
    val sourceResponse = JsonParser.fromJson[SystemInfo](response.contentString)
    assert(sourceResponse != null)
  }

  test("test connection source") {
    val testConnectionRequest = TestConnectionRequest(
      sourceConfig = ClickhouseSource("jdbc:clickhouse://tvc12", "tvc12", "123456","")
    )
    val response: Response = server.httpPost("/databases/system/test-connection", postBody = JsonParser.toJson(testConnectionRequest), andExpect = Status.Ok)
    val connectionResponse = JsonParser.fromJson[TestConnectionResponse](response.contentString)
    assert(connectionResponse != null)
    assert(connectionResponse.isSuccess == true)
  }

  test("refresh connection source") {
    val response: Response = server.httpPost("/databases/system/refresh-schema", postBody = "{}", andExpect = Status.Ok)
    val refreshConnectionResponse = JsonParser.fromJson[Map[String, Any]](response.contentString)
    assert(refreshConnectionResponse != null)
    assert(refreshConnectionResponse.getOrElse("is_success", false) == true)
  }
}
