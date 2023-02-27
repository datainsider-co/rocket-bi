package datainsider.jobworker.service.handlers

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.module.MockSchemaClientModule
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.handler.SourceMetadataHandler
import datainsider.jobworker.util.ZConfig

class MsSqlHandlerTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()
  injector.synchronized()

  val jdbcUrl: String = ZConfig.getString("database_test.mssql.url")
  val username: String = ZConfig.getString("database_test.mssql.username")
  val password: String = ZConfig.getString("database_test.mssql.password")

  val source: JdbcSource = JdbcSource(
    1,
    id = 0L,
    displayName = "DI MSSql",
    databaseType = DatabaseType.SqlServer,
    jdbcUrl = jdbcUrl,
    username = username,
    password = password
  )

  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)

  test("test mssql test connection") {
    val connected = Await.result(sourceHandler.testConnection())
    assert(connected)
  }

  test("test mssql list db") {
    val dbs: Seq[String] = Await.result(sourceHandler.listDatabases())
    assert(dbs.nonEmpty)
    assert(dbs.contains("dbo"))
    println(dbs.mkString(", "))
  }

  test("test mssql list tbl") {
    val tables: Seq[String] = Await.result(sourceHandler.listTables("dbo"))
    assert(tables.nonEmpty)
    assert(tables.contains("spt_fallback_db"))
    println(tables.mkString(", "))
  }

  test("test mssql test job") {
    val job = JdbcJob(
      1,
      jobId = 0,
      jobType = JobType.Jdbc,
      sourceId = 0L,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 60,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      destinations = Seq(DataDestination.Clickhouse),
      databaseName = "dbo",
      tableName = "spt_values",
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      query = None
    )
    val connected = Await.result(sourceHandler.testJob(job))
    assert(connected)
  }

}
