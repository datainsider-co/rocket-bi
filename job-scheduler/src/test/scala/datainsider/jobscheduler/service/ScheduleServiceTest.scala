package datainsider.jobscheduler.service

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule, SchemaClientModule}
import datainsider.jobscheduler.domain.{DatabaseType, JdbcSource}
import datainsider.jobscheduler.domain.job.{JdbcJob, JobStatus, JobType}
import datainsider.jobscheduler.domain.request.CreateDatasourceRequest
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import datainsider.lakescheduler.module.LakeTestModule
import org.scalatest.BeforeAndAfterAll

class ScheduleServiceTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector =
    TestInjector(TestModule, LakeTestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()
  val scheduleService: ScheduleService = injector.instance[ScheduleService]
  val jobService: JobService = injector.instance[JobService]
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val dataSource: JdbcSource =
    JdbcSource(
      1,
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

    sourceId = await(sourceService.create(1, "root", dataSource)).get.getId
  }

  override def afterAll(): Unit = {
    await(jobService.delete(1, jobId))
    await(sourceService.delete(1, sourceId))
  }

  test("test get full sync job") {
    val job: JdbcJob = JdbcJob(
      orgId = 1,
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
      orgId = 1,
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
    jobId = await(jobService.create(1, "", job)).job.jobId

    scheduleService.start()
    Thread.sleep(2000)
    val nextJobs = await(scheduleService.status())
    assert(nextJobs.nonEmpty)
    assert(nextJobs.head.job.jobId == jobId)
    assert(nextJobs.head.source.get.getId == sourceId)
  }

}
