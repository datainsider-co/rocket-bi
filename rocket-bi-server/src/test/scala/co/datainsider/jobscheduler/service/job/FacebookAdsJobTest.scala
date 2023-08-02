package co.datainsider.jobscheduler.service.job

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.job.{FacebookAdsJob, JobStatus}
import co.datainsider.jobscheduler.domain.request.UpdateJobRequest
import co.datainsider.jobscheduler.domain.response.JobInfo
import co.datainsider.jobscheduler.domain.source.FacebookAdsSource
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.{DataSourceService, JobService}
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.exception.BadRequestError
import org.scalatest.BeforeAndAfterAll

class FacebookAdsJobTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val jobService: JobService = injector.instance[JobService]
  var facebookAdsJob: FacebookAdsJob = FacebookAdsJob(
    orgId = 1L,
    displayName = "test",
    lastSuccessfulSync = 0L,
    syncIntervalInMn = 1500,
    lastSyncStatus = JobStatus.Unknown,
    currentSyncStatus = JobStatus.Unknown,
    destDatabaseName = "test",
    destTableName = "google_sheet",
    destinations = Seq("Clickhouse"),
    accountId = "ad_account_id",
    tableName = "Campaigns",
    sourceId = -1
  )
  var dataSource: FacebookAdsSource = FacebookAdsSource(
    orgId = 1,
    id = 1,
    displayName = "fb_ads_source_test",
    accessToken = "test",
    creatorId = "test",
    lastModify = -1
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    val dataSource = FacebookAdsSource(
      orgId = 1,
      creatorId = "1",
      displayName = "test",
      accessToken = "access_token",
      id = 1,
      lastModify = 0
    )
    val sourceId = await(sourceService.create(1, "root", dataSource)).get.getId
    facebookAdsJob = facebookAdsJob.copy(sourceId = sourceId)
  }

  override def afterAll(): Unit = {
    await(sourceService.delete(1, facebookAdsJob.sourceId))
  }

  test("test create facebook Ads job") {
    val newJob: JobInfo = await(jobService.create(facebookAdsJob.orgId, "", facebookAdsJob))
    dataSource =
      await(sourceService.get(facebookAdsJob.orgId, facebookAdsJob.sourceId)).get.asInstanceOf[FacebookAdsSource]
    assert(newJob.source.isDefined)
    assert(newJob.source.get.equals(dataSource))
    val createdFacebookAdsJob = newJob.job.asInstanceOf[FacebookAdsJob]
    assert(createdFacebookAdsJob.sourceId.equals(facebookAdsJob.sourceId))
    assert(createdFacebookAdsJob.destinations.equals(facebookAdsJob.destinations))
    assert(createdFacebookAdsJob.displayName.equals(facebookAdsJob.displayName))
    assert(createdFacebookAdsJob.destDatabaseName.equals(facebookAdsJob.destDatabaseName))
    assert(createdFacebookAdsJob.destTableName.equals(facebookAdsJob.destTableName))
    facebookAdsJob = createdFacebookAdsJob
  }

  test("test get fb ads job") {
    val jobInfo = await(jobService.get(facebookAdsJob.orgId, facebookAdsJob.jobId))
    assert(jobInfo.job.equals(facebookAdsJob))
  }

  test("test update fb ads job ") {
    val isSuccess = await(
      jobService.update(
        facebookAdsJob.orgId,
        UpdateJobRequest(
          id = facebookAdsJob.jobId,
          job = facebookAdsJob.copy(accountId = "2222"),
          request = null
        )
      )
    )
    assert(isSuccess)
  }

  test("test delete fb ad job") {
    val isSuccess = await(jobService.delete(facebookAdsJob.orgId, facebookAdsJob.jobId))
    assert(isSuccess)
    val fbJob = jobService.get(facebookAdsJob.orgId, facebookAdsJob.jobId)
    assertFailedFuture[BadRequestError](fbJob)
  }

}
