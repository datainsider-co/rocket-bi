package co.datainsider.datacook.controller

import co.datainsider.bi.TestServer
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.MockData
import co.datainsider.datacook.domain.request.etl._
import co.datainsider.datacook.domain.request.share.{RevokeShareRequest, ShareEtlToUsersRequest}
import co.datainsider.datacook.domain.response._
import co.datainsider.schema.domain.ResourceInfo
import com.twitter.finagle.http.{Response, Status}
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.util.JsonParser

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 4:26 PM
  */
class ShareDataCookControllerTest extends FeatureTest {
  override val server = new EmbeddedHttpServer(new TestServer)

  var jobId: EtlJobId = 0
  test("Create ETL") {
    val request = CreateEtlJobRequest(
      displayName = "Test create etl",
      operators = Array(MockData.mockOperator),
      scheduleTime = Some(ScheduleOnce(System.currentTimeMillis()))
    )
    val response: Response =
      server.httpPost("/data_cook/create", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)
    assertResult(true)(result != null)
    jobId = result.id
  }

  test("Share to Users") {
    val request = ShareEtlToUsersRequest(jobId, Map("123" -> Seq("view", "edit")))
    val response: Response =
      server.httpPost("/data_cook/345/share", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)

    val results = JsonParser.fromJson[Map[String, Boolean]](response.contentString)

    assertResult(true)(results.nonEmpty)
  }

  test("List Shared User of etl") {
    val response: Response = server.httpGet(s"/data_cook/$jobId/share/list?from=0&size=30", andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)

    val resourceInfo = JsonParser.fromJson[ResourceInfo](response.contentString)

    assertResult(true)(resourceInfo != null)
    assertResult(true)(resourceInfo.owner.isDefined)
    assertResult(true)(resourceInfo.totalUserSharing == 0)
    assertResult(true)(resourceInfo.usersSharing.isEmpty)
  }

  test("Revoke Share") {
    val request = RevokeShareRequest(123, Seq("tvc12", "hello"))
    val response: Response =
      server.httpDelete("/data_cook/345/share/revoke", deleteBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)

    val results = JsonParser.fromJson[Map[String, Boolean]](response.contentString)

    assertResult(true)(results.nonEmpty)
  }
}
