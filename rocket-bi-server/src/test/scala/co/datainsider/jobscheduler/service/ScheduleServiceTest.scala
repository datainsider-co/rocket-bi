package co.datainsider.jobscheduler.service

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.DatabaseType
import co.datainsider.jobscheduler.domain.job.{JdbcJob, JobStatus, JobType}
import co.datainsider.jobscheduler.domain.source.JdbcSource
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.scheduler.ScheduleOnce
import org.scalatest.BeforeAndAfterAll

class ScheduleServiceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()

  val scheduleService: ScheduleService = injector.instance[ScheduleService]
  val jobService: JobService = injector.instance[JobService]
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val orgId = 1L
  val dataSource: JdbcSource =
    JdbcSource(
      orgId,
      1,
      "new_data_source",
      DatabaseType.MySql,
      "jdbc:mysql://localhost:3306",
      "root",
      "di@123",
      "root",
      System.currentTimeMillis()
    )
  var sourceId = 0L // init later
  var jobId = 0L // init later

  override def beforeAll(): Unit = {
    val schemaReady = for {
      jobOk <- injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema()
      sourceOk <- injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema()
      historyOk <- injector.instance[SchemaManager](Names.named("history-schema")).ensureSchema()
    } yield jobOk && sourceOk && historyOk
    await(schemaReady)

    sourceId = await(sourceService.create(orgId, "root", dataSource)).get.getId
  }


  override def afterAll(): Unit = {
    await(jobService.delete(orgId, jobId))
    await(sourceService.delete(orgId, sourceId))
  }

  test("test get full sync job") {
    val job: JdbcJob = JdbcJob(
      orgId = orgId,
      jobId = 1,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = sourceId,
      lastSuccessfulSync = 1000000,
      syncIntervalInMn = -1, // full sync job is job with interval <= 0
      lastSyncStatus = JobStatus.Synced,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      destinations = Seq("Clickhouse"),
      incrementalColumn = None,
      queryStatement = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000
    )

    val nextJob = await(scheduleService.getNextJob)
    assert(nextJob.isEmpty)
  }

  test("test get incremental sync job") {
    val job: JdbcJob = JdbcJob(
      orgId = orgId,
      jobId = 1,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = sourceId,
      lastSuccessfulSync = 1000000,
      syncIntervalInMn = 60, // incremental sync job is job with interval > 0
      lastSyncStatus = JobStatus.Synced,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      destinations = Seq("Clickhouse"),
      queryStatement = None,
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleOnce(0)
    )
    jobId = await(jobService.create(orgId, "", job)).job.jobId

    scheduleService.start()
    Thread.sleep(2000)
    val nextJobs = await(scheduleService.status())
    assert(nextJobs.nonEmpty)
  }

}
