package co.datainsider.jobscheduler.service.job

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.job._
import co.datainsider.jobscheduler.domain.request.UpdateJobRequest
import co.datainsider.jobscheduler.domain.response.JobInfo
import co.datainsider.jobscheduler.domain.source.TikTokAdsSource
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.{DataSourceService, JobService}
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.exception.BadRequestError
import org.scalatest.BeforeAndAfterAll

class TikTokAdsJobTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val jobService: JobService = injector.instance[JobService]
  var tikTokAdsJob = TikTokAdsJob(
    orgId = 1,
    jobId = 1,
    displayName = "test",
    jobType = JobType.TikTokAds,
    creatorId = "1",
    sourceId = -1,
    lastSuccessfulSync = -1,
    syncIntervalInMn = -1,
    lastSyncStatus = JobStatus.Unknown,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = "db_test",
    destTableName = "tbl_test",
    destinations = Seq(),
    advertiserId = "1",
    tikTokEndPoint = "report/integrated/get",
    tikTokReport = Some(
      TikTokReport(reportType = "ReservationBasicAdBasicData", timeRange = TikTokTimeRange("2020-12-08", "2021-02-01"))
    ),
    lastSyncedValue = Some("2020-12-22")
  )
  var dataSource: TikTokAdsSource = TikTokAdsSource(
    orgId = 1,
    id = 1,
    displayName = "tik_tok_ads_source_test",
    accessToken = "test",
    creatorId = "test",
    lastModify = -1
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    val dataSource = TikTokAdsSource(
      orgId = 1,
      creatorId = "1",
      displayName = "test",
      accessToken = "access_token",
      id = 1,
      lastModify = 0
    )
    val sourceId = await(sourceService.create(1, "root", dataSource)).get.getId
    tikTokAdsJob = tikTokAdsJob.copy(sourceId = sourceId)
  }

  override def afterAll(): Unit = {
    await(sourceService.delete(1, tikTokAdsJob.sourceId))
  }

  test("test create tiktok Ads job") {
    val newJob: JobInfo = await(jobService.create(tikTokAdsJob.orgId, "", tikTokAdsJob))
    dataSource = await(sourceService.get(tikTokAdsJob.orgId, tikTokAdsJob.sourceId)).get.asInstanceOf[TikTokAdsSource]
    assert(newJob.source.isDefined)
    assert(newJob.source.get.equals(dataSource))
    val createdTikTokAdsJob = newJob.job.asInstanceOf[TikTokAdsJob]
    assert(createdTikTokAdsJob.sourceId.equals(tikTokAdsJob.sourceId))
    assert(createdTikTokAdsJob.destinations.equals(tikTokAdsJob.destinations))
    assert(createdTikTokAdsJob.displayName.equals(tikTokAdsJob.displayName))
    assert(createdTikTokAdsJob.destDatabaseName.equals(tikTokAdsJob.destDatabaseName))
    assert(createdTikTokAdsJob.destTableName.equals(tikTokAdsJob.destTableName))
    assert(createdTikTokAdsJob.tikTokReport.equals(tikTokAdsJob.tikTokReport))
    tikTokAdsJob = createdTikTokAdsJob
  }

  test("test get tiktok ads job") {
    val jobInfo = await(jobService.get(tikTokAdsJob.orgId, tikTokAdsJob.jobId))
    assert(jobInfo.job.equals(tikTokAdsJob))
  }

  test("test update tiktok ads job ") {
    val isSuccess = await(
      jobService.update(
        tikTokAdsJob.orgId,
        UpdateJobRequest(
          id = tikTokAdsJob.jobId,
          job = tikTokAdsJob.copy(advertiserId = "2222"),
          request = null
        )
      )
    )
    assert(isSuccess)
  }

  test("test delete tiktok ads job") {
    val isSuccess = await(jobService.delete(tikTokAdsJob.orgId, tikTokAdsJob.jobId))
    assert(isSuccess)
    val fbJob = jobService.get(tikTokAdsJob.orgId, tikTokAdsJob.jobId)
    assertFailedFuture[BadRequestError](fbJob)
  }

  test("create multi job") {
    val jobs: Seq[TikTokAdsJob] = tikTokAdsJob
      .toMultiJob(
        1,
        "test",
        Seq(
          TikTokAdsEndPoint.Ads,
          TikTokAdsEndPoint.AdGroups,
          TikTokAdsEndPoint.Campaigns,
          TikTokAdsEndPoint.Advertisers,
          TikTokAdsEndPoint.Report
        )
      )
      .asInstanceOf[Seq[TikTokAdsJob]]
    assert(jobs.length == 43)
  }

}
