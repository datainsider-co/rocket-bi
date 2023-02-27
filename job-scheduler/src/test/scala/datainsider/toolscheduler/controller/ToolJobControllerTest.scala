package datainsider.toolscheduler.controller

import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.util.JsonParser
import datainsider.jobscheduler.TestServer
import datainsider.jobscheduler.domain.request.PaginationResponse
import datainsider.toolscheduler.domain.ToolJob
import datainsider.toolscheduler.domain.request.{CreateToolJobRequest, ListToolJobRequest, UpdateToolJobRequest}

class ToolJobControllerTest extends FeatureTest {
  override protected val server = new EmbeddedHttpServer(twitterServer = new TestServer)

  var jobId = 0L

  test("test create tool job") {

    val createToolJobRequest = CreateToolJobRequest(
      name = "tool job test",
      description = "job description",
      jobData = Map("some_data" -> "some job data"),
      scheduleTime = ScheduleOnce(0L)
    )

    val r = server.httpPost(
      path = "/tool/job/create",
      postBody = JsonParser.toJson(createToolJobRequest),
      andExpect = Status.Ok
    )

    val respContent = r.contentString
    assert(respContent.nonEmpty)

    val createdJob = JsonParser.fromJson[ToolJob](respContent)
    assert(createdJob.jobId != 0)

    jobId = createdJob.jobId
  }

  test("test list tool job") {
    val listToolJobRequest = ListToolJobRequest(0, 10)

    val r = server.httpPost(
      path = "/tool/job/list",
      postBody = JsonParser.toJson(listToolJobRequest),
      andExpect = Status.Ok
    )

    val respContent = r.contentString
    assert(respContent.nonEmpty)

    val jobs = JsonParser.fromJson[PaginationResponse[ToolJob]](respContent)
    assert(jobs.total > 0)
    assert(jobs.data.nonEmpty)
  }

  test("test update tool job") {
    val updateToolJobRequest = UpdateToolJobRequest(
      name = Some("new_name"),
      description = Some("new description")
    )

    val r = server.httpPut(
      path = s"/tool/job/$jobId",
      putBody = JsonParser.toJson(updateToolJobRequest),
      andExpect = Status.Ok
    )

  }

  test("test get updated job") {
    val r = server.httpGet(
      path = s"/tool/job/$jobId",
      andExpect = Status.Ok
    )

    val resp = r.getContentString()
    assert(resp.nonEmpty)

    val job = JsonParser.fromJson[ToolJob](resp)
    assert(job.jobId == jobId)
    assert(job.name == "new_name")
  }

  test("test delete tool job") {
    val r = server.httpDelete(
      path = s"/tool/job/$jobId",
      andExpect = Status.Ok
    )

    val resp = r.getContentString()
  }
}
