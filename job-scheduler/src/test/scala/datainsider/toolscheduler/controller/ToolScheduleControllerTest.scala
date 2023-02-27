package datainsider.toolscheduler.controller

import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.scheduler.{ScheduleDaily, ScheduleOnce}
import datainsider.client.util.JsonParser
import datainsider.jobscheduler.TestServer
import datainsider.toolscheduler.domain.{NextJobInfo, ToolJob, ToolJobHistory, ToolJobStatus, ToolJobType}
import datainsider.toolscheduler.service.ToolJobService
import org.scalatest.BeforeAndAfterAll

class ToolScheduleControllerTest extends FeatureTest with BeforeAndAfterAll {
  override protected val server = new EmbeddedHttpServer(twitterServer = new TestServer)
  val toolJobService = server.injector.instance[ToolJobService]

  val orgId: Long = 0
  var jobId: Long = 0
  var runId: Long = 0

  val toolJob = ToolJob(
    jobId = jobId,
    orgId = orgId,
    name = "verification job",
    description = "verify data",
    jobType = ToolJobType.DataVerification,
    jobData = Map("some_data" -> "some job data"),
    scheduleTime = ScheduleDaily(1, 0),
    lastRunTime = 0L,
    lastRunStatus = ToolJobStatus.Init,
    nextRunTime = 0L,
    currentRunStatus = ToolJobStatus.Init,
    createdBy = "some_user",
    createdAt = 0L,
    updatedBy = "another_user",
    updatedAt = 0L
  )

  override def beforeAll(): Unit = {
    super.beforeAll()

    toolJobService.create(toolJob).syncGet()

  }

  override def afterAll(): Unit = {
    super.afterAll()

    toolJobService.delete(orgId, jobId)
  }

  test("test get next tool job") {
    val r = server.httpGet("/tool/schedule/next", andExpect = Status.Ok)

    val respContent = r.getContentString()
    assert(respContent.nonEmpty)

    val nextJobInfo = JsonParser.fromJson[NextJobInfo](respContent)
    assert(nextJobInfo.hasNext)

    jobId = nextJobInfo.data.get.toolJob.jobId
    runId = nextJobInfo.data.get.runId

    assert(jobId != 0)
    assert(runId != 0)
  }

  test("test report job") {
    val toolHistory = ToolJobHistory(
      runId = runId,
      orgId = orgId,
      jobId = jobId,
      jobName = toolJob.name,
      jobType = toolJob.jobType,
      jobStatus = ToolJobStatus.Finished,
      jobData = Map.empty,
      historyData = Map.empty,
      beginAt = System.currentTimeMillis(),
      endAt = System.currentTimeMillis(),
      message = "job queued"
    )

    val r = server.httpPost(
      "/tool/schedule/report",
      andExpect = Status.Ok,
      postBody = JsonParser.toJson(toolHistory)
    )

    println(r.getContentString())

  }

  test("test get updated job") {
    val updatedJob: ToolJob = toolJobService.get(orgId, jobId).syncGet()
    println(updatedJob)
    assert(updatedJob.currentRunStatus == ToolJobStatus.Finished)
    assert(updatedJob.nextRunTime != toolJob.nextRunTime)
    assert(updatedJob.nextRunTime > System.currentTimeMillis())
  }

}
