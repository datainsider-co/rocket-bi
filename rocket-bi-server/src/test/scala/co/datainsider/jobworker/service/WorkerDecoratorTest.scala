package co.datainsider.jobworker.service

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.source.JdbcSource
import co.datainsider.jobworker.service.worker.{FullSyncWorker, JdbcIncrementalSyncWorker, JdbcWorker}
import co.datainsider.jobworker.util.ClickhouseDbTestUtils
import co.datainsider.schema.client.{MockSchemaClientService, SchemaClientService}
import com.google.inject.name.Names
import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.BeforeAndAfterAll

import scala.concurrent.ExecutionContext.Implicits.global

class WorkerDecoratorTest extends AbstractWorkerTest with BeforeAndAfterAll {
  val destDatabaseName: String = ZConfig.getString("fake_data.database.marketing.name", default = "database_test")
  val destTblName: String = ZConfig.getString("fake_data.table.marketing.name", default = "student")

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
    dbTestUtils.createTable(destDatabaseName, destTblName)
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
  }

  val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
  val username: String = ZConfig.getString("test_db.clickhouse.username")
  val password: String = ZConfig.getString("test_db.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)

  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
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

  val client = injector.instance[JdbcClient]("clickhouse")

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
    await(ssdbKVS.add(1, true).asTwitter)
    val worker = new JdbcWorker(source, schemaService, ssdbKVS, engine = engine, connection = connection)
    val fullSyncWorker =
      new FullSyncWorker(schemaService, dataSource = Some(source), ssdbKVS, engine = engine, connection = connection)

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

    await(ssdbKVS.add(1, true).asTwitter)
    val worker = new JdbcWorker(source, schemaService, ssdbKVS, engine = engine, connection = connection)
    val fullSyncWorker =
      new FullSyncWorker(schemaService, dataSource = Some(source), ssdbKVS, engine = engine, connection = connection)
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
    await(ssdbKVS.add(1, true).asTwitter)
    val worker = new JdbcWorker(source, schemaService, ssdbKVS, engine = engine, connection = connection)
    val incrementalSyncWorker = new JdbcIncrementalSyncWorker(worker)
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
    await(ssdbKVS.add(1, true).asTwitter)
    val worker = new JdbcWorker(source, schemaService, ssdbKVS, engine = engine, connection = connection)
    val incrementalSyncWorker = new JdbcIncrementalSyncWorker(worker)
    val progress: JobProgress = incrementalSyncWorker.run(job, 1, reportProgress)
    assert(progress != null)
  }
}
