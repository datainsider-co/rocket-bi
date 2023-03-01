package datainsider.jobscheduler.service.job

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{DateColumn, FloatColumn, Int32Column, Int64Column, StringColumn}
import datainsider.client.exception.BadRequestError
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.client.util.JsonParser
import datainsider.jobscheduler.domain.job.{GoogleSheetJobV2, JobStatus}
import datainsider.jobscheduler.domain.request.UpdateJobRequest
import datainsider.jobscheduler.domain.response.JobInfo
import datainsider.jobscheduler.domain.source.GoogleSheetSource
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.service.{DataSourceService, JobService}
import datainsider.lakescheduler.module.LakeTestModule
import org.scalatest.BeforeAndAfterAll

class GoogleSheetJobV2Test extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector =
    TestInjector(TestModule, LakeTestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()
  val sourceService = injector.instance[DataSourceService]
  val jobService = injector.instance[JobService]
  var googleSheetJobV2 = GoogleSheetJobV2(
    orgId = 1L,
    displayName = "test",
    lastSuccessfulSync = 0L,
    syncIntervalInMn = 1500,
    lastSyncStatus = JobStatus.Unknown,
    currentSyncStatus = JobStatus.Unknown,
    destDatabaseName = "test",
    destTableName = "google_sheet",
    destinations = Seq("Clickhouse"),
    spreadSheetId = "",
    sheetId = 0,
    schema = TableSchema(
      name = "database_test",
      dbName = "test",
      organizationId = 1,
      displayName = "student",
      columns = Seq(
        StringColumn("name", "Name", isNullable = true),
      )
    )
  )
  var dataSource: GoogleSheetSource = GoogleSheetSource(
    orgId = 1,
    creatorId = "1",
    displayName = "test",
    accessToken = "access_token",
    refreshToken = "refresh_token",
    id = 1,
    lastModify = 0
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    val dataSource = GoogleSheetSource(
      orgId = 1,
      creatorId = "1",
      displayName = "test",
      accessToken = "access_token",
      refreshToken = "refresh_token",
      id = 1,
      lastModify = 0
    )
    val sourceId = await(sourceService.create(1, "root", dataSource)).get.getId
    googleSheetJobV2 = googleSheetJobV2.copy(sourceId=sourceId)
  }

  override def afterAll(): Unit = {
    await(sourceService.delete(1, googleSheetJobV2.sourceId))
  }

  test("test create GoogleSheetJobV2"){
    val newJob: JobInfo = await(jobService.create(googleSheetJobV2.orgId,"",googleSheetJobV2))
    dataSource=  await(sourceService.get(googleSheetJobV2.orgId,googleSheetJobV2.sourceId)).get.asInstanceOf[GoogleSheetSource]
    assert(newJob.source.isDefined)
    assert(newJob.source.get.equals(dataSource))
    val createdGoogleSheetJob= newJob.job.asInstanceOf[GoogleSheetJobV2]
    assert(createdGoogleSheetJob.sourceId.equals(googleSheetJobV2.sourceId))
    assert(createdGoogleSheetJob.sheetId.equals(googleSheetJobV2.sheetId))
    assert(createdGoogleSheetJob.spreadSheetId.equals(googleSheetJobV2.spreadSheetId))
    assert(createdGoogleSheetJob.destinations.equals(googleSheetJobV2.destinations))
    assert(createdGoogleSheetJob.displayName.equals(googleSheetJobV2.displayName))
    assert(createdGoogleSheetJob.destDatabaseName.equals(googleSheetJobV2.destDatabaseName))
    assert(createdGoogleSheetJob.destTableName.equals(googleSheetJobV2.destTableName))
    googleSheetJobV2= createdGoogleSheetJob
  }

  test("test get googleSheetJobV2"){
     val jobInfo= await( jobService.get(googleSheetJobV2.orgId,googleSheetJobV2.jobId))
    assert(jobInfo.job.equals(googleSheetJobV2))
  }

  test("test update google sheet job v2"){
   val isSuccess= await(  jobService.update(googleSheetJobV2.orgId,UpdateJobRequest(id = googleSheetJobV2.jobId, job = googleSheetJobV2.copy(sheetId = 10,spreadSheetId = "wqewqcq123"), request = null)))
    assert(isSuccess)
  }

  test("test delete google sheet job v2"){
    val isSuccess = await(jobService.delete(googleSheetJobV2.orgId,googleSheetJobV2.jobId))
    assert(isSuccess)
    val googleSheetJob=jobService.get(googleSheetJobV2.orgId,googleSheetJobV2.jobId)
    assertFailedFuture[BadRequestError](googleSheetJob)
  }
}
