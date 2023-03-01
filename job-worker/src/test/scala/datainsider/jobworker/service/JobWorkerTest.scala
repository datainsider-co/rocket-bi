package datainsider.jobworker.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.{LakeClientModule, MockSchemaClientModule}
import datainsider.client.service.{LakeClientService, MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.JdbcWorker
import datainsider.jobworker.util.{ClickhouseDbTestUtils, ZConfig}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.BeforeAndAfterAll

class JobWorkerTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, LakeClientModule).newInstance()

  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
  val lakeService: LakeClientService = injector.instance[LakeClientService]
  val destDatabaseName: String = ZConfig.getString("fake_data.database.marketing.name", default = "database_test")
  val destTblName: String = ZConfig.getString("fake_data.table.marketing.name", default = "student")

  val jdbcUrl: String = ZConfig.getString("database_test.clickhouse.url")
  val username: String = ZConfig.getString("database_test.clickhouse.username")
  val password: String = ZConfig.getString("database_test.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
    dbTestUtils.createTable(destDatabaseName, destTblName)
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
  }

  test("clickhouse job worker test") {
    val job: JdbcJob = JdbcJob(
      1,
      jobId = 1,
      sourceId = 1,
      jobType = JobType.Jdbc,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      lastSuccessfulSync = 0L,
      syncIntervalInMn = 1,
      databaseName = "highschool",
      tableName = "student",
      destDatabaseName = destDatabaseName,
      destTableName = destTblName,
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = Some("id"),
      query = None,
      lastSyncedValue = "10",
      maxFetchSize = 1000
    )
    val source: JdbcSource = JdbcSource(
      1,
      id = 0L,
      displayName = "local MySql",
      databaseType = DatabaseType.MySql,
      jdbcUrl = "jdbc:mysql://localhost:3306",
      username = "root",
      password = "di@2020!"
    )

    ssdbKVS.add(1, true).synchronized()
    val worker: JdbcWorker = new JdbcWorker(source, schemaService, ssdbKVS)
    worker.run(job, 1, onProgress)
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    Future.Unit
  }

  test("test job fail in process insert data to clickhouse by clickhouse client") {
    val job: JdbcJob = JdbcJob(
      1,
      jobId = 1,
      sourceId = 1,
      jobType = JobType.Jdbc,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      lastSuccessfulSync = 0L,
      syncIntervalInMn = 1,
      databaseName = "highschool",
      tableName = "student",
      destDatabaseName = "1001_database1",
      destTableName = "marketing",
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = Some("id"),
      query = None,
      lastSyncedValue = "10",
      maxFetchSize = 1000
    )
    val source: JdbcSource = JdbcSource(
      1,
      id = 0L,
      displayName = "local MySql",
      databaseType = DatabaseType.MySql,
      jdbcUrl = "jdbc:mysql://localhost:3306",
      username = "root",
      password = "di@2020!"
    )

    ssdbKVS.add(1, true).synchronized()
    val worker: JdbcWorker = new JdbcWorker(source, schemaService, ssdbKVS)
    val report: JobProgress = worker.run(job, 1, onProgress)
    assert(report.jobStatus.equals(JobStatus.Error))
    assert(report.message.isDefined)
  }
}
