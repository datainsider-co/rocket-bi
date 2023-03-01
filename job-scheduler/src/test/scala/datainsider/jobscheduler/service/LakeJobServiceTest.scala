package datainsider.jobscheduler.service

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.domain.scheduler.{ScheduleHourly, ScheduleMinutely}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse}
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import datainsider.lakescheduler.domain.HttpCloneInfo
import datainsider.lakescheduler.domain.job.{BuildTool, JavaJob, LakeJobStatus}
import datainsider.lakescheduler.domain.request.{ListLakeJobRequest, UpdateLakeJobRequest}
import datainsider.lakescheduler.domain.response.{LakeJobResponse, LakeRunInfo}
import datainsider.lakescheduler.module.LakeTestModule
import datainsider.lakescheduler.service.LakeJobService
import org.scalatest.BeforeAndAfterAll

import java.util.concurrent.{BlockingQueue, LinkedBlockingQueue}

class LakeJobServiceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector =
    TestInjector(TestModule, LakeTestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()
  val jobService: LakeJobService = injector.instance[LakeJobService]

  override def beforeAll(): Unit = {
    Await.result(injector.instance[SchemaManager](Names.named("lake-job-schema")).ensureSchema())
  }

  var jobId: JobId = 0
  test("create job") {
    val job = JavaJob(
      orgId = 1,
      jobId = 1,
      name = "job",
      lastRunTime = 1000000,
      lastRunStatus = LakeJobStatus.Finished,
      currentJobStatus = LakeJobStatus.Init,
      gitCloneInfo = HttpCloneInfo("git@123", "", ""),
      buildTool = BuildTool.Maven,
      buildCmd = "execute",
      scheduleTime = ScheduleMinutely(10),
      creatorId = "trung hau"
    )
    val jobResp: LakeJobResponse = Await.result(jobService.create(1, job))
    assert(jobResp != null)
    jobId = jobResp.job.jobId
  }

  test("test get job") {
    val jobResp: LakeJobResponse = Await.result(jobService.get(1, jobId))
    assert(jobResp != null)
    println(jobResp)
  }

  test("test get jobs") {
    val jobsResp: PaginationResponse[LakeJobResponse] = jobService.list(1, ListLakeJobRequest(from = 0, size = 10, request =  null)).sync()
    assert(jobsResp.data.nonEmpty)
    jobsResp.data.foreach(println)
  }

  test("test update job") {
    val job = JavaJob(
      orgId = 1,
      jobId = jobId,
      name = "job",
      lastRunTime = 1000000,
      lastRunStatus = LakeJobStatus.Finished,
      currentJobStatus = LakeJobStatus.Init,
      gitCloneInfo = HttpCloneInfo("git@123", "", ""),
      buildTool = BuildTool.Maven,
      buildCmd = "execute cute cute cute",
      scheduleTime = ScheduleHourly(1000),
      creatorId = "trung hau"
    )
    val updateReq = UpdateLakeJobRequest(id = jobId, job = job, request = null)
    assert(jobService.update(1, updateReq).sync())
    val updatedJob: LakeJobResponse = jobService.get(1, jobId).sync()
    assert(job.scheduleTime.equals(updatedJob.job.scheduleTime))
  }

  test("test delete job") {
    assert(jobService.delete(1, jobId).sync())
  }

  test("cancel job") {
    val jobQueue: BlockingQueue[LakeRunInfo] = new LinkedBlockingQueue[LakeRunInfo](4)
    val jobs = Seq(
      JavaJob(
        orgId = 1,
        jobId = 1,
        name = "job",
        lastRunTime = 1000000,
        lastRunStatus = LakeJobStatus.Finished,
        currentJobStatus = LakeJobStatus.Finished,
        gitCloneInfo = HttpCloneInfo("https://git@123", "", ""),
        buildTool = BuildTool.Maven,
        buildCmd = "execute",
        scheduleTime = ScheduleMinutely(10),
        creatorId = "trung hau"
      ),
      JavaJob(
        orgId = 1,
        jobId = 2,
        name = "job",
        lastRunTime = 1000000,
        lastRunStatus = LakeJobStatus.Finished,
        currentJobStatus = LakeJobStatus.Queued,
        gitCloneInfo = HttpCloneInfo("https://git@123", "", ""),
        buildTool = BuildTool.Maven,
        buildCmd = "execute",
        scheduleTime = ScheduleMinutely(10),
        creatorId = "trung hau"
      )
    )

    var runId = 1L
    jobs.foreach(job => jobQueue.put(LakeRunInfo(runId, job)))
    assert(jobQueue.size().equals(2))
    println(jobQueue.removeIf(lakeRunInfo => {
      lakeRunInfo.job.jobId.equals(jobs.head.jobId)
    }))
    assert(jobQueue.size().equals(1))
  }
}
