package datainsider.jobscheduler.service.job

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.scheduler.ScheduleMinutely
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.domain.GoogleServiceAccountSource
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.domain.job._
import datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse, UpdateJobRequest}
import datainsider.jobscheduler.domain.response.JobInfo
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.service.{DataSourceService, JobService}
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import datainsider.lakescheduler.module.LakeTestModule
import org.scalatest.BeforeAndAfterAll

class Ga4JobTest extends IntegrationTest with BeforeAndAfterAll {

  override protected val injector: Injector = TestInjector(TestModule, LakeTestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()
  val jobService: JobService = injector.instance[JobService]
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val dataSource = GoogleServiceAccountSource(1L, 1L, "ga4-source", credential =
    """
      |{
      |  "type": "service_account",
      |  "project_id": "ga4-project-1662716211975",
      |  "private_key_id": "5ad4a346b672abdddf0f041f09ab02ff0c038230",
      |  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQBhSHxpoC7Bax\n5Y5dv514VLRIirutmGIKSY193X3MNRorOhNI9VL21PW9mFkJnbLETMqdXzmaHr+M\nkOCjUPafGSJP6mRsQznn611PYsYXKFnZt1+d2me5BFhcm6zf4z7CXcheHSykn6ge\nUuvQTlFz4iMy2Y1A0/xhRPKLuE2pZDA+xRUbacowjow6qM4TcZ4aFKEaRj7SEXWU\ndEOu88pw/SJk4uFmQJarQ2MQN7fCDXJfC/yfFOmcyqZCNNdd1o/vFokkf06RijYF\nItQWXzqqGZLyToa7uLqdD5kfxiNhjzcewD6i5S7hm65eLPq5qP4EDDsxFTdo2CMm\nCgSEdBzdAgMBAAECggEAXFrWspERv0phqQlpc2Wm281/XNV7DU8h978/+iljuE27\nGIXoGfQQqVVS5KHGpeZFf7E4IzYrtKkCEb4gfWFsnKXj/ebqPsZ55uUvwBbyK0XW\n3jnzUXmtow6yzCqxTZTuQAyy8FWzhEL9uLjHyOt8bh5v0huUArwayHR72lww3oq3\nl2P5wns0AOdbA9G0BFBWk/vnAcxpMNT+XQp29Q2kxY3yW1fRWIZL8CmVI5z26t2y\nB7NTyTFpR4U6jm08C2sLUdHTARzQ8SOFSMNEAxisyzhX3C/5Lto48F+9gHejFGca\nMYPswm8ItdjfOm3efh4RV1LlT4F7Tw5j33EQPw0nYQKBgQDn9/C0JdG+CWMAf37M\n0msJLC1NN5lEp/mFB193x/ir613nJm0SlTYinuqoyi6WkagB/4A7LxGGCwOQlF7w\nrSSawh5kVWvd9cdraoUuPiO5kSyOfzTgnugg7MomImHVlXVpoBvkV2Lb8mtxdsHt\nnP01QpvVYNeYmm/9DxUgSqr8vwKBgQDlkxk1MRkm3TvFWcbCfFL/UUTqvxmPIQeL\n4Pnfi2+8TZHJxIeTH/LVjHlXQ0WkCo62pJ6WvisQ2xB7E1YgMPMT0mfOfN1dMw4e\nv/yhEpzr+2Nh4nR43RWDADnIlFQDXKhrpn98GHHTWVGyoi6mhaY6dGXMfOmNfHXr\nQ8AIeXBhYwKBgQCq9xRS0eTqOSTcgxtDfnohAoxI8wdlkJ/Yqfx03c+rdgd5i9qr\n7Yk+rv2odYsssiGvh05NUH2L26Y+8vueSx5FaXjY3hRoPPNDefi6glX2OMcsJxkj\nzDqtuZerz39n2YX12Wl1O+rCzMLfl3WK2T/N90+/TmbYNEsBqhIaAK5RJQKBgQDU\nbI0Zo+mzBWiGDrEUSnd92dQcJmFfB9/0tWJgT6Q/J8NrYBdWsmw+3vF0JkItLLur\nEp3Pu/0bZqhUSasatFBnmfwFm5I058X7/AelfxSGYqEt9J1zLJb4FWBiUaV/SuBo\nY7J4wCGqv24SDXF/EhGi6ws68KYnDfAKljD9ZmjvIwKBgEsV/75dAEh7211cJOZv\nImc+EyZoZeiLodBqTCRk/7JkEZgQPGqiAlsF2RQOXW8TauI5KCN2OfpY7lK53KaT\nadSraLfttorc/lRHHbFEx2Xvb6H7MSgI4hJvIEIU8MBwHfWPXzM2AR/+Wy+Bq551\n3qqrrpp5861V9nT8Lac6dm9a\n-----END PRIVATE KEY-----\n",
      |  "client_email": "starting-account-c5s0nsi4oa7f@ga4-project-1662716211975.iam.gserviceaccount.com",
      |  "client_id": "111032448903620990514",
      |  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      |  "token_uri": "https://oauth2.googleapis.com/token",
      |  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      |  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/starting-account-c5s0nsi4oa7f%40ga4-project-1662716211975.iam.gserviceaccount.com"
      |}
      |""".stripMargin)
  var jobId: JobId = 0L
  var ga4Job = Ga4Job(
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
    propertyId = "314717053",
    dateRanges = Array(Ga4DateRange("10daysAgo", "today")),
    metrics = Array(Ga4Metric("eventCount", "int64")),
    dimensions = Array(Ga4Dimension("eventName"), Ga4Dimension("sessionSourceMedium")),
    lastSyncedValue = "",
    incrementalColumn = None
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())

    val sourceId = await(sourceService.create(1, "root", dataSource)).get.getId
    ga4Job = ga4Job.copy(sourceId = sourceId)
  }

  override def afterAll(): Unit = {
    await(sourceService.delete(1, ga4Job.sourceId))
  }

  private def assertKafkaJob(job: Ga4Job, expected: Ga4Job): Unit = {
    assert(job.orgId == expected.orgId)
    assert(job.displayName == expected.displayName)
    assert(job.jobType == expected.jobType)
    assert(job.sourceId == expected.sourceId)
    assert(job.lastSuccessfulSync == expected.lastSuccessfulSync)
    assert(job.syncIntervalInMn == expected.syncIntervalInMn)
    assert(job.lastSyncStatus == expected.lastSyncStatus)
    assert(job.currentSyncStatus == expected.currentSyncStatus)
    assert(job.destDatabaseName == expected.destDatabaseName)
    assert(job.destTableName == expected.destTableName)
    assert(job.destinations == expected.destinations)
    assert(job.scheduleTime == expected.scheduleTime)
    assert(job.lastSyncedValue == expected.lastSyncedValue)
    assert(job.dimensions.toSet == expected.dimensions.toSet)
    assert(job.metrics.toSet == expected.metrics.toSet)
    assert(job.dateRanges.toSet == expected.dateRanges.toSet)
  }

  test("create job success") {
    val newJob: JobInfo = await(jobService.create(ga4Job.orgId, "", ga4Job))
    assert(newJob != null)
    assert(newJob.source.isDefined)
    assert(newJob.source.get.getId == ga4Job.sourceId)
    val jobAsKafkaJob = newJob.job.asInstanceOf[Ga4Job]
    assertKafkaJob(jobAsKafkaJob, ga4Job)
    jobId = newJob.job.jobId
  }

  test("test get job") {
    val jobInfo: JobInfo = await(jobService.get(ga4Job.orgId, jobId))
    assert(jobInfo != null)
    assert(jobInfo.source.get.getId == ga4Job.sourceId)
    val jobAsKafkaJob = jobInfo.job.asInstanceOf[Ga4Job]
    assertKafkaJob(jobAsKafkaJob, ga4Job)
  }

  test("test get jobs") {
    val jobsResp: PaginationResponse[JobInfo] =
      jobService.list(ga4Job.orgId, PaginationRequest(0, 10, request = null)).sync()
    assert(jobsResp.data.nonEmpty)
    println(s"size of list jobs ${jobsResp.data.size}")
  }

  test("test update job") {
    val newJob = ga4Job.copy(displayName = "test-update", metrics = Array.empty[Ga4Metric], jobId = jobId)
    val updateRequest: UpdateJobRequest = UpdateJobRequest(id = jobId, job = newJob, request = null)
    val isSuccess = await(jobService.update(ga4Job.orgId, updateRequest))
    assert(isSuccess)
    val updatedJob: JobInfo = await(jobService.get(ga4Job.orgId, jobId))
    println(s"new job name: ${updatedJob.job.displayName}")
    assert(updatedJob.source.get.getId == ga4Job.sourceId)
    val jobAsKafkaJob = updatedJob.job.asInstanceOf[Ga4Job]
    assertKafkaJob(jobAsKafkaJob, newJob)
  }

  test("delete job") {
    val isSuccess = await(jobService.delete(ga4Job.orgId, jobId))
    assert(isSuccess)
  }
}
