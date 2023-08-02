// fixme: this test is not working
//package co.datainsider.jobworker.service.handlers
//
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.domain.source.JdbcSource
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.service.handler.SourceMetadataHandler
//import co.datainsider.bi.util.ZConfig
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import com.twitter.util.Await
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule}
//
//class OracleHandlerTest extends IntegrationTest {
//
//  override protected def injector: Injector =
//    TestInjector(JobWorkerTestModule, MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule)
//      .newInstance()
//  injector.synchronized()
//
//  val jdbcUrl: String = ZConfig.getString("test_db.oracle.url")
//  val username: String = ZConfig.getString("test_db.oracle.username")
//  val password: String = ZConfig.getString("test_db.oracle.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    id = 0L,
//    displayName = "DI Oracle",
//    databaseType = DatabaseType.Oracle,
//    jdbcUrl = jdbcUrl,
//    username = username,
//    password = password
//  )
//
//  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)
//
//  test("test oracle test connection") {
//    val connected = Await.result(sourceHandler.testConnection())
//    assert(connected)
//  }
//
//  test("test oracle list db") {
//    val dbs: Seq[String] = Await.result(sourceHandler.listDatabases())
//    assert(dbs.nonEmpty)
//    assert(dbs.contains("TVC12")) //TODO use inserted data
//    println(dbs.mkString(", "))
//  }
//
//  test("test oracle list tbl") {
//    val tables: Seq[String] = Await.result(sourceHandler.listTables("TVC12"))
//    assert(tables.nonEmpty)
//    assert(tables.contains("SALES_1M")) //TODO use inserted data
//    println(tables.mkString(", "))
//  }
//
//  test("test oracle test job") {
//    val job = JdbcJob(
//      1,
//      jobId = 0,
//      jobType = JobType.Jdbc,
//      sourceId = 0L,
//      lastSuccessfulSync = 0,
//      syncIntervalInMn = 60,
//      lastSyncStatus = JobStatus.Init,
//      destinations = Seq(DataDestination.Clickhouse),
//      currentSyncStatus = JobStatus.Init,
//      databaseName = "TVC12",
//      tableName = "SALES_1M",
//      incrementalColumn = None,
//      lastSyncedValue = "0",
//      maxFetchSize = 1000,
//      query = None
//    )
//    val connected = Await.result(sourceHandler.testJob(job))
//    assert(connected)
//  }
//
//}
