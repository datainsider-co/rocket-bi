package datainsider.jobworker.service

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{DateColumn, FloatColumn, Int32Column, Int64Column, StringColumn}
import datainsider.client.module.MockSchemaClientModule
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.domain.{DatabaseType, JdbcSource, JobProgress, JobStatus, MongoJob, MongoSource}
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.MongoWorker
import datainsider.jobworker.util.{ClickhouseDbTestUtils, ZConfig}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.BeforeAndAfterAll

class MongoWorkerTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()
  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
  val destDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")
  val destTblName: String = ZConfig.getString("fake_data.table.student.name", default = "student")
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

  val dataSource: MongoSource = MongoSource(
    orgId = 1L,
    id = 1,
    displayName = "test",
    host = ZConfig.getString("database_test.mongodb.host"),
    port = None,
    username = ZConfig.getString("database_test.mongodb.username"),
    password = ZConfig.getString("database_test.mongodb.password"),
    tlsConfiguration = None,
    connectionUri = None
  )

  val destSource: JdbcSource = JdbcSource(
    1,
    id = 0L,
    displayName = "local clickhouse",
    databaseType = DatabaseType.Clickhouse,
    jdbcUrl = "jdbc:clickhouse://localhost:9000",
    username = "admin",
    password = "di@2020!"
  )

  val job: MongoJob = MongoJob(
    1,
    jobId = 2,
    sourceId = 0L,
    lastSuccessfulSync = 0L,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Queued,
    displayName = "test",
    destDatabaseName = destDatabaseName,
    destTableName = destTblName,
    databaseName = "highschool",
    tableName = "student",
    incrementalColumn = None,
    lastSyncedValue = "0",
    maxFetchSize = 1000,
    flattenDepth = 0
  )

  ssdbKVS.add(1, true).synchronized()
  val worker = new MongoWorker(dataSource, schemaService, ssdbKVS)

  test("test mongodb worker") {
    worker.run(job, 1, onProgress = onProgress)
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    Future.Unit
  }
}
