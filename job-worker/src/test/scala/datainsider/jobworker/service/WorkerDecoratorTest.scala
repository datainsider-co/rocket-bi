package datainsider.jobworker.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockSchemaClientModule
import datainsider.client.service.{HadoopFileClientService, LakeClientService, MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.domain._
import datainsider.jobworker.module.{MockHadoopFileClientModule, TestModule}
import datainsider.jobworker.service.worker.{JdbcIncrementalSyncWorker, JdbcWorker}
import datainsider.jobworker.service.worker.{FullSyncWorker, JdbcIncrementalSyncWorker, JdbcWorker}
import datainsider.jobworker.util.{ClickhouseDbTestUtils, ZConfig}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.BeforeAndAfterAll

class WorkerDecoratorTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule, MockHadoopFileClientModule).newInstance()

  val destDatabaseName: String = ZConfig.getString("fake_data.database.marketing.name", default = "database_test")
  val destTblName: String = ZConfig.getString("fake_data.table.marketing.name", default = "student")

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
    dbTestUtils.createTable(destDatabaseName, destTblName)
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
  }

  val jdbcUrl: String = ZConfig.getString("database_test.clickhouse.url")
  val username: String = ZConfig.getString("database_test.clickhouse.username")
  val password: String = ZConfig.getString("database_test.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)

  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val hadoopFileService: HadoopFileClientService = injector.instance[HadoopFileClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)

  val source: JdbcSource = JdbcSource(
    1,
    id = 0L,
    displayName = "Local MySql",
    databaseType = DatabaseType.MySql,
    jdbcUrl = "jdbc:mysql://localhost:3306",
    username = "root",
    password = "di@2020!"
  )

  val destSource: JdbcSource = JdbcSource(
    1,
    id = 0L,
    displayName = "Local Clickhouse",
    databaseType = DatabaseType.Clickhouse,
    jdbcUrl = "jdbc:clickhouse://localhost:9000",
    username = "default",
    password = ""
  )

  private def reportProgress(progress: JobProgress): Future[Unit] = {
    Future.Unit
  }

  test("test full sync worker after first time") {
    val job = JdbcJob(
      1,
      jobId = 0,
      jobType = JobType.Jdbc,
      syncMode = SyncMode.FullSync,
      sourceId = 0L,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 60,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "highschool",
      tableName = "student",
      destDatabaseName = destDatabaseName,
      destTableName = destTblName,
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      query = None
    )
    ssdbKVS.add(1, true).synchronized()
    val worker = new JdbcWorker(source, schemaService, ssdbKVS)
    val fullSyncWorker =
      new FullSyncWorker(schemaService, dataSource = Some(source), null, ssdbKVS, hadoopFileService)

    val progress: JobProgress = fullSyncWorker.run(job, 1, reportProgress)
    assert(progress != null)
  }

  test("test full sync first time") {
    val job = JdbcJob(
      1,
      jobId = 0,
      jobType = JobType.Jdbc,
      syncMode = SyncMode.FullSync,
      sourceId = 0L,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 60,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "highschool",
      tableName = "student",
      destDatabaseName = destDatabaseName,
      destTableName = destTblName,
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = None,
      lastSyncedValue = "20",
      maxFetchSize = 1000,
      query = None
    )

    ssdbKVS.add(1, true).synchronized()
    val worker = new JdbcWorker(source, schemaService, ssdbKVS)
    val fullSyncWorker =
      new FullSyncWorker(schemaService, dataSource = Some(source), null, ssdbKVS, hadoopFileService)
    val progress: JobProgress = fullSyncWorker.run(job, 1, reportProgress)
    assert(progress != null)
  }

  test("test incremental sync worker after first time") {
    val job = JdbcJob(
      1,
      jobId = 0,
      jobType = JobType.Jdbc,
      sourceId = 0L,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 60,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "highschool",
      tableName = "student",
      destDatabaseName = destDatabaseName,
      destTableName = destTblName,
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = Some("id"),
      lastSyncedValue = "10",
      maxFetchSize = 1000,
      query = None
    )
    ssdbKVS.add(1, true).synchronized()
    val worker = new JdbcWorker(source, schemaService, ssdbKVS)
    val incrementalSyncWorker = new JdbcIncrementalSyncWorker(destSource, worker)
    val progress: JobProgress = incrementalSyncWorker.run(job, 1, reportProgress)
    assert(progress != null)
  }

  test("test incremental sync worker first time sync") {
    val job = JdbcJob(
      1,
      jobId = 0,
      jobType = JobType.Jdbc,
      sourceId = 0L,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 60,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "highschool",
      tableName = "student",
      destDatabaseName = destDatabaseName,
      destTableName = destTblName,
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = Some("id"),
      lastSyncedValue = "10",
      maxFetchSize = 1000,
      query = None
    )
    ssdbKVS.add(1, true).synchronized()
    val worker = new JdbcWorker(source, schemaService, ssdbKVS)
    val incrementalSyncWorker = new JdbcIncrementalSyncWorker(destSource, worker)
    val progress: JobProgress = incrementalSyncWorker.run(job, 1, reportProgress)
    assert(progress != null)
  }
}
