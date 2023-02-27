//package datainsider.jobworker.service.handlers
//
//import com.twitter.inject.Test
//import com.twitter.util.Await
//import datainsider.jobworker.domain.{DataDestination, DatabaseType, JdbcJob, JdbcSource, JobStatus, JobType}
//import datainsider.jobworker.service.handler.SourceMetadataHandler
//import datainsider.jobworker.util.ZConfig
//
//class RedshiftHandlerTest extends Test {
//
//  val jdbcUrl: String = ZConfig.getString("database_test.redshift.url")
//  val username: String = ZConfig.getString("database_test.redshift.username")
//  val password: String = ZConfig.getString("database_test.redshift.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    id = 0L,
//    displayName = "DI Redshift",
//    databaseType = DatabaseType.Redshift,
//    jdbcUrl = jdbcUrl,
//    username = username,
//    password = password
//  )
//
//  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)
//
//  test("test redshift test connection") {
//    val connected = Await.result(sourceHandler.testConnection())
//    assert(connected)
//  }
//
//  test("test redshift list db") {
//    val dbs: Seq[String] = Await.result(sourceHandler.listDatabases()) // TODO: wrong?
//    assert(dbs.nonEmpty)
//    assert(dbs.contains("public"))
//    println(dbs.mkString(", "))
//  }
//
//  test("test redshift list tbl") {
//    val tables: Seq[String] = Await.result(sourceHandler.listTables("public"))
//    assert(tables.nonEmpty)
//    assert(tables.contains("pet"))
//    println(tables.mkString(", "))
//  }
//
//  test("test redshift test job") {
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
//      databaseName = "public",
//      tableName = "pet",
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
