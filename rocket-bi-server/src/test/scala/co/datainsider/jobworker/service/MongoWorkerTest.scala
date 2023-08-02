//package co.datainsider.jobworker.service
//
//import co.datainsider.bi.util.ZConfig
//import co.datainsider.jobworker.domain.job.MongoJob
//import co.datainsider.jobworker.domain.source.{JdbcSource, MongoSource}
//import co.datainsider.jobworker.domain.{DatabaseType, JobProgress, JobStatus}
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.service.worker.MongoWorker
//import co.datainsider.jobworker.util.ClickhouseDbTestUtils
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import com.twitter.util.Future
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule}
//import co.datainsider.schema.client.{MockSchemaClientService, SchemaClientService}
//import com.google.inject.name.Names
//import education.x.commons.SsdbKVS
//import org.nutz.ssdb4j.spi.SSDB
//import org.scalatest.BeforeAndAfterAll
//
//class MongoWorkerTest extends IntegrationTest with BeforeAndAfterAll {
//
//  override protected def injector: Injector = TestInjector(JobWorkerTestModule, MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule).newInstance()
//  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
//  val ssdbClient: SSDB = injector.instance[SSDB]
//  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
//  val destDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")
//  val destTblName: String = ZConfig.getString("fake_data.table.student.name", default = "student")
//  val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
//  val username: String = ZConfig.getString("test_db.clickhouse.username")
//  val password: String = ZConfig.getString("test_db.clickhouse.password")
//  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)
//
//  override def beforeAll(): Unit = {
//    dbTestUtils.createDatabase(destDatabaseName)
//    dbTestUtils.createTable(destDatabaseName, destTblName)
//  }
//
//  override def afterAll(): Unit = {
//    dbTestUtils.dropDatabase(destDatabaseName)
//  }
//
//  val dataSource: MongoSource = MongoSource(
//    orgId = 1L,
//    id = 1,
//    displayName = "test",
//    host = ZConfig.getString("test_db.mongodb.host"),
//    port = None,
//    username = ZConfig.getString("test_db.mongodb.username"),
//    password = ZConfig.getString("test_db.mongodb.password"),
//    tlsConfiguration = None,
//    connectionUri = None
//  )
//
//  val destSource: JdbcSource = JdbcSource(
//    1,
//    id = 0L,
//    displayName = "local clickhouse",
//    databaseType = DatabaseType.Clickhouse,
//    jdbcUrl = "jdbc:clickhouse://localhost:9000",
//    username = "admin",
//    password = "di@2020!"
//  )
//
//  val job: MongoJob = MongoJob(
//    1,
//    jobId = 2,
//    sourceId = 0L,
//    lastSuccessfulSync = 0L,
//    syncIntervalInMn = 0,
//    lastSyncStatus = JobStatus.Init,
//    currentSyncStatus = JobStatus.Queued,
//    displayName = "test",
//    destDatabaseName = destDatabaseName,
//    destTableName = destTblName,
//    databaseName = "highschool",
//    tableName = "student",
//    incrementalColumn = None,
//    lastSyncedValue = "0",
//    maxFetchSize = 1000,
//    flattenDepth = 0
//  )
//
//  ssdbKVS.add(1, true).synchronized()
//  val worker = new MongoWorker(dataSource, schemaService, ssdbKVS)
//
//  test("test mongodb worker") {
//    worker.run(job, 1, onProgress = onProgress)
//  }
//
//  def onProgress(progress: JobProgress): Future[Unit] = {
//    Future.Unit
//  }
//}
