package datainsider.jobworker.service.handlers

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.module.MockSchemaClientModule
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.handler.SourceMetadataHandler
import datainsider.jobworker.util.ZConfig

class MySqlHandlerTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()
  injector.synchronized()

  val jdbcUrl: String = ZConfig.getString("database_test.mysql.url")
  val username: String = ZConfig.getString("database_test.mysql.username")
  val password: String = ZConfig.getString("database_test.mysql.password")

  val source: JdbcSource = JdbcSource(
    1,
    id = 0L,
    displayName = "DI MySql",
    databaseType = DatabaseType.MySql,
    jdbcUrl = jdbcUrl,
    username = username,
    password = password
  )

  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)

  test("test mysql test connection") {
    val connected = Await.result(sourceHandler.testConnection())
    assert(connected)
  }

  test("test mysql list db") {
    val dbs: Seq[String] = Await.result(sourceHandler.listDatabases())
    assert(dbs.nonEmpty)
    assert(dbs.contains("information_schema"))
    assert(dbs.contains("mysql"))
    println(dbs.mkString(", "))
  }

  test("test mysql list tbl") {
    val tables: Seq[String] = Await.result(sourceHandler.listTables("information_schema"))
    assert(tables.nonEmpty)
    assert(tables.contains("CHARACTER_SETS"))
    println(tables.mkString(", "))
  }

  test("test mysql test job") {
    val job = JdbcJob(
      1,
      jobId = 0,
      jobType = JobType.Jdbc,
      sourceId = 0L,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 60,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "information_schema",
      tableName = "CHARACTER_SETS",
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      query = None
    )
    val connected = Await.result(sourceHandler.testJob(job))
    assert(connected)
  }

}
