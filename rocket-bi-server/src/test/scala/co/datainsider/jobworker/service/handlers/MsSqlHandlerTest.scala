//package co.datainsider.jobworker.service.handlers
//
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.bi.util.ZConfig
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.domain.source.JdbcSource
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.service.handler.SourceMetadataHandler
//import co.datainsider.schema.module.MockSchemaClientModule
//import com.google.inject.name.Names
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
//
//class MsSqlHandlerTest extends IntegrationTest {
//
//  override protected def injector: Injector =
//    TestInjector(JobWorkerTestModule, TestContainerModule, MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule)
//      .newInstance()
//
//  val jdbcUrl: String = injector.instance[String](Names.named("mssql_jdbc_url"))
//  val username: String = ZConfig.getString("test_db.mssql.username")
//  val password: String = ZConfig.getString("test_db.mssql.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    id = 0L,
//    displayName = "DI MSSql",
//    databaseType = DatabaseType.SqlServer,
//    jdbcUrl = jdbcUrl,
//    username = username,
//    password = password
//  )
//
//  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)
//
//  test("test mssql test connection") {
//    val connected = await(sourceHandler.testConnection())
//    assert(connected)
//  }
//
//  test("test mssql list db") {
//    val dbs: Seq[String] = await(sourceHandler.listDatabases())
//    assert(dbs.nonEmpty)
//    assert(dbs.contains("dbo"))
//    println(dbs.mkString(", "))
//  }
//
//  test("test mssql list tbl") {
//    val tables: Seq[String] = await(sourceHandler.listTables("dbo"))
//    assert(tables.nonEmpty)
//    assert(tables.contains("spt_fallback_db"))
//    println(tables.mkString(", "))
//  }
//
//  test("test mssql test job") {
//    val job = JdbcJob(
//      1,
//      jobId = 0,
//      jobType = JobType.Jdbc,
//      sourceId = 0L,
//      lastSuccessfulSync = 0,
//      syncIntervalInMn = 60,
//      lastSyncStatus = JobStatus.Init,
//      currentSyncStatus = JobStatus.Init,
//      destinations = Seq(DataDestination.Clickhouse),
//      databaseName = "dbo",
//      tableName = "spt_values",
//      incrementalColumn = None,
//      lastSyncedValue = "0",
//      maxFetchSize = 1000,
//      query = None
//    )
//    val connected = await(sourceHandler.testJob(job))
//    assert(connected)
//  }
//
//}
