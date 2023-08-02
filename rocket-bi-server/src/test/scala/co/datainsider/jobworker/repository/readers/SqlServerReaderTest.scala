//// fixme: this test is not working, cause no mssql server is available
//
//package co.datainsider.jobworker.repository.readers
//
//import co.datainsider.jobworker.domain.source.JdbcSource
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.repository.JdbcReader
//import co.datainsider.bi.util.ZConfig
//import com.twitter.inject.Test
//
//class SqlServerReaderTest extends Test {
//
//  val jdbcUrl: String = ZConfig.getString("test_db.mssql.url")
//  val username: String = ZConfig.getString("test_db.mssql.username")
//  val password: String = ZConfig.getString("test_db.mssql.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    1,
//    "DI MSSql",
//    DatabaseType.SqlServer,
//    jdbcUrl = jdbcUrl,
//    username = username,
//    password = password
//  )
//
//  val job: JdbcJob = JdbcJob(
//    1,
//    jobId = 1,
//    sourceId = 1L,
//    lastSyncStatus = JobStatus.Init,
//    lastSuccessfulSync = 0L,
//    syncIntervalInMn = 1,
//    databaseName = "dbo",
//    tableName = "student",
//    destinations = Seq(DataDestination.Clickhouse),
//    incrementalColumn = None,
//    lastSyncedValue = "0",
//    jobType = JobType.Jdbc,
//    currentSyncStatus = JobStatus.Init,
//    maxFetchSize = 1000,
//    query = None
//  )
//
//  test("test mysql simple reader") {
//    val reader: JdbcReader = JdbcReader(source, job, 10)
//
//    val tableSchema = reader.getTableSchema
//    println(tableSchema)
//    tableSchema.columns.foreach(println)
//    assert(tableSchema != null)
//
//    var count = 0
//    while (reader.hasNext & count < 10) {
//      val records = reader.next
//      assert(records.nonEmpty)
//      count += records.length
//      records.foreach(row => println(row.mkString(", ")))
//      println(reader.getLastSyncedValue)
//    }
//    println(count)
//  }
//
//  test("test mysql incremental reader") {
//    val incrementalJob = job.copy(incrementalColumn = Some("id"), lastSyncedValue = "0")
//
//    val reader: JdbcReader = JdbcReader(source, incrementalJob, 10)
//
//    val tableSchema = reader.getTableSchema
//    println(tableSchema)
//    tableSchema.columns.foreach(println)
//    assert(tableSchema != null)
//
//    var count = 0
//    while (reader.hasNext & count < 8) {
//      val records = reader.next
//      assert(records.nonEmpty)
//      count += records.length
//      records.foreach(row => println(row.mkString(", ")))
//      println(reader.getLastSyncedValue)
//    }
//    println(count)
//
//  }
//}
