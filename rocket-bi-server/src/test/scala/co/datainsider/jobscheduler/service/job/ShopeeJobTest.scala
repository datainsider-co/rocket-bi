package co.datainsider.jobscheduler.service.job

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.Ids.JobId
import co.datainsider.jobscheduler.domain.RangeValue
import co.datainsider.jobscheduler.domain.job.{JobStatus, ShopeeJob}
import co.datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse, UpdateJobRequest}
import co.datainsider.jobscheduler.domain.response.JobInfo
import co.datainsider.jobscheduler.domain.source.Ga4Source
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.{DataSourceService, JobService}
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.scheduler.ScheduleMinutely
import org.scalatest.BeforeAndAfterAll

class ShopeeJobTest extends IntegrationTest with BeforeAndAfterAll {

  override protected val injector: Injector =
    TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()
  val jobService: JobService = injector.instance[JobService]
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val dataSource = Ga4Source(1L, 1L, "ga4-source", "refresh-token", "access-token")

  var jobId: JobId = 0L
  var expectedJob = ShopeeJob(
    orgId = 1,
    jobId = 1L,
    displayName = "sad",
    sourceId = 0L,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 10,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = "1001_database1",
    destTableName = "transaction",
    destinations = Seq("Clickhouse"),
    scheduleTime = ScheduleMinutely(10),
    lastSyncedValue = None,
    shopId = "123",
    timeRange = RangeValue(0, 100),
    incrementalColumn = Some("time"),
    tableName = "transaction"
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())

    val sourceId = await(sourceService.create(1, "root", dataSource)).get.getId
    expectedJob = expectedJob.copy(sourceId = sourceId)
  }

  override def afterAll(): Unit = {
    await(sourceService.delete(1, expectedJob.sourceId))
  }

  private def assertJob(baseJob: ShopeeJob, expected: ShopeeJob): Unit = {
    assert(baseJob.orgId == expected.orgId)
    assert(baseJob.displayName == expected.displayName)
    assert(baseJob.jobType == expected.jobType)
    assert(baseJob.sourceId == expected.sourceId)
    assert(baseJob.lastSuccessfulSync == expected.lastSuccessfulSync)
    assert(baseJob.syncIntervalInMn == expected.syncIntervalInMn)
    assert(baseJob.lastSyncStatus == expected.lastSyncStatus)
    assert(baseJob.currentSyncStatus == expected.currentSyncStatus)
    assert(baseJob.destDatabaseName == expected.destDatabaseName)
    assert(baseJob.destTableName == expected.destTableName)
    assert(baseJob.destinations == expected.destinations)
    assert(baseJob.scheduleTime == expected.scheduleTime)
    assert(baseJob.lastSyncedValue == expected.lastSyncedValue)
    assert(baseJob.shopId == expected.shopId)
    assert(baseJob.incrementalColumn == expected.incrementalColumn)
    assert(baseJob.tableName == expected.tableName)
    assert(baseJob.timeRange == expected.timeRange)
  }

  test("create job success") {
    val newJob: JobInfo = await(jobService.create(expectedJob.orgId, "", expectedJob))
    assert(newJob != null)
    assert(newJob.source.isDefined)
    assert(newJob.source.get.getId == expectedJob.sourceId)

    val resultJob = newJob.job.asInstanceOf[ShopeeJob]
    assertJob(resultJob, expectedJob)
    jobId = newJob.job.jobId
  }

  test("test get job") {
    val jobInfo: JobInfo = await(jobService.get(expectedJob.orgId, jobId))
    assert(jobInfo != null)
    assert(jobInfo.source.get.getId == expectedJob.sourceId)
    val resultJob = jobInfo.job.asInstanceOf[ShopeeJob]
    assertJob(resultJob, expectedJob)
  }

  test("test get jobs") {
    val jobsResp: PaginationResponse[JobInfo] =
      jobService.list(expectedJob.orgId, PaginationRequest(0, 10, request = null)).sync()
    assert(jobsResp.data.nonEmpty)
    println(s"size of list jobs ${jobsResp.data.size}")
  }

  test("test update job") {
    val newJob = expectedJob.copy(
      displayName = "test-update",
      tableName = "tvc12",
      jobId = jobId,
      incrementalColumn = Some("time_1"),
      timeRange = RangeValue(0, 1000),
      shopId = "1234",
      lastSyncedValue = Some("1234")
    )
    val updateRequest: UpdateJobRequest = UpdateJobRequest(id = jobId, job = newJob, request = null)
    val isSuccess = await(jobService.update(expectedJob.orgId, updateRequest))
    assert(isSuccess)
    val updatedJob: JobInfo = await(jobService.get(expectedJob.orgId, jobId))
    println(s"new job name: ${updatedJob.job.displayName}")
    assert(updatedJob.source.get.getId == expectedJob.sourceId)
    val resultJob = updatedJob.job.asInstanceOf[ShopeeJob]
    assertJob(resultJob, newJob)
  }

  test("delete job") {
    val isSuccess = await(jobService.delete(expectedJob.orgId, jobId))
    assert(isSuccess)
  }
}
