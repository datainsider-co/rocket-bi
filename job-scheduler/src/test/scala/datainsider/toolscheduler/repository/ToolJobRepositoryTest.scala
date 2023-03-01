package datainsider.toolscheduler.repository

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.module.TestModule
import datainsider.toolscheduler.domain.{ToolJob, ToolJobStatus, ToolJobType}
import datainsider.toolscheduler.module.ToolTestModule
import datainsider.toolscheduler.repository.ToolJobRepository

class ToolJobRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, ToolTestModule, MockCaasClientModule, MockSchemaClientModule).newInstance()

  val toolJobRepository = injector.instance[ToolJobRepository]

  val orgId: Long = 0
  var jobId: Long = 0

  val toolJob = ToolJob(
    jobId = jobId,
    orgId = orgId,
    name = "verification job",
    description = "verify data",
    jobType = ToolJobType.DataVerification,
    jobData = Map("some_data" -> "some job data"),
    scheduleTime = ScheduleOnce(0L),
    lastRunTime = 0L,
    lastRunStatus = ToolJobStatus.Init,
    nextRunTime = 0L,
    currentRunStatus = ToolJobStatus.Init,
    createdBy = "some_user",
    createdAt = 0L,
    updatedBy = "another_user",
    updatedAt = 0L
  )

  test("test create job") {
    val createdId = toolJobRepository.create(toolJob).syncGet()
    assert(createdId != 0)

    jobId = createdId
  }

  test("test list tool jobs") {
    val jobs = toolJobRepository.list(orgId, "", 0, 10, Seq.empty).syncGet
    assert(jobs.nonEmpty)
  }

  test("test count jobs") {
    val total = toolJobRepository.count(orgId, "").syncGet
    assert(total > 0)
  }

  test("test update job") {
    val updateOk = toolJobRepository.update(toolJob.copy(orgId = orgId, jobId = jobId, name = "updated_name")).syncGet()
    assert(updateOk)
  }

  test("test get job by id") {
    val job = toolJobRepository.get(orgId, jobId).syncGet()
    assert(job.isDefined)
    assert(job.get.name == "updated_name")
  }

  test("test get next job") {
    val nextJob = toolJobRepository.getNextJob(0L).syncGet()
    assert(nextJob.isDefined)
    assert(nextJob.get.jobId == jobId)
  }

  test("test delete job") {
    val deleteOk = toolJobRepository.delete(orgId, jobId).syncGet()
    assert(deleteOk)
  }

}
