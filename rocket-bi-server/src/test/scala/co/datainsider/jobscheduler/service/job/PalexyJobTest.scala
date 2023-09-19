package co.datainsider.jobscheduler.service.job

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.Ids.JobId
import co.datainsider.jobscheduler.domain.job.{JobStatus, DateRangeInfo, PalexyJob}
import co.datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse, UpdateJobRequest}
import co.datainsider.jobscheduler.domain.response.JobInfo
import co.datainsider.jobscheduler.domain.source.PalexySource
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.{DataSourceService, JobService}
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.scheduler.ScheduleMinutely
import org.scalatest.BeforeAndAfterAll

class PalexyJobTest extends IntegrationTest with BeforeAndAfterAll {

  override protected val injector: Injector =
    TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).create
  val jobService: JobService = injector.instance[JobService]
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val dataSource =
    PalexySource(orgId = 1L, id = 1L, displayName = "source", apiKey = "api-key", creatorId = "creator-id")

  var jobId: JobId = 0L
  var expectedJob = PalexyJob(
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
    lastSyncedValue = Some("tvc12"),
    dimensions = Set("dimension1", "dimension2"),
    metrics = Set("metric1", "metric2"),
    dateRange = DateRangeInfo(
      fromDate = "2019-01-01",
      toDate = "2019-01-02"
    ),
    storeIds = Set("1", "2"),
    storeCodes = Set.empty
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

  private def assertJob(baseJob: PalexyJob, expected: PalexyJob): Unit = {
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
    assert(baseJob.dimensions == expected.dimensions)
    assert(baseJob.metrics == expected.metrics)
    assert(baseJob.storeCodes == expected.storeCodes)
    assert(baseJob.storeIds == expected.storeIds)
    assert(baseJob.dateRange == expected.dateRange)
  }

  test("create job success") {
    val newJob: JobInfo = await(jobService.create(expectedJob.orgId, "", expectedJob))
    assert(newJob != null)
    assert(newJob.source.isDefined)
    assert(newJob.source.get.getId == expectedJob.sourceId)

    val resultJob = newJob.job.asInstanceOf[PalexyJob]
    assertJob(resultJob, expectedJob)
    jobId = newJob.job.jobId
  }

  test("test get job") {
    val jobInfo: JobInfo = await(jobService.get(expectedJob.orgId, jobId))
    assert(jobInfo != null)
    assert(jobInfo.source.get.getId == expectedJob.sourceId)
    val resultJob = jobInfo.job.asInstanceOf[PalexyJob]
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
      jobId = jobId,
      lastSyncedValue = Some("1234"),
      storeCodes = Set("1234"),
      storeIds = Set("1234"),
      dimensions = Set("1234"),
      metrics = Set("1234"),
      dateRange = DateRangeInfo(
        fromDate = "2019-01-01",
        toDate = "2019-01-02"
      )
    )
    val updateRequest: UpdateJobRequest = UpdateJobRequest(id = jobId, job = newJob, request = null)
    val isSuccess = await(jobService.update(expectedJob.orgId, updateRequest))
    assert(isSuccess)
    val updatedJob: JobInfo = await(jobService.get(expectedJob.orgId, jobId))
    println(s"new job name: ${updatedJob.job.displayName}")
    assert(updatedJob.source.get.getId == expectedJob.sourceId)
    val resultJob = updatedJob.job.asInstanceOf[PalexyJob]
    assertJob(resultJob, newJob)
  }

  test("delete job") {
    val isSuccess = await(jobService.delete(expectedJob.orgId, jobId))
    assert(isSuccess)
  }
}
