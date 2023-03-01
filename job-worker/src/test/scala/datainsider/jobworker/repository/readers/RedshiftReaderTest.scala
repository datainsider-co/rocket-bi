//package datainsider.jobworker.repository.readers
//
//import datainsider.jobworker.domain._
//import datainsider.jobworker.repository.JdbcReader
//import datainsider.jobworker.util.ZConfig
//import org.scalatest.FunSuite
//
//class RedshiftReaderTest extends FunSuite {
//
//  val jdbcUrl: String = ZConfig.getString("database_test.redshift.url")
//  val username: String = ZConfig.getString("database_test.redshift.username")
//  val password: String = ZConfig.getString("database_test.redshift.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    1,
//    "DI Redshift",
//    DatabaseType.Redshift,
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
//    lastSyncedValue = "0",
//    syncIntervalInMn = 1,
//    databaseName = "public", // TODO: add test data
//    tableName = "pet",
//    destinations = Seq(DataDestination.Clickhouse),
//    incrementalColumn = None,
//    jobType = JobType.Jdbc,
//    currentSyncStatus = JobStatus.Init,
//    maxFetchSize = 1000,
//    query = None
//  )
//
//  test("test redshift simple reader") {
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
//  test("test redshift incremental reader") {
//    val incrementalJob = job.copy(incrementalColumn = Some("age"), lastSyncedValue = "0") // TODO: add test data
//
//    val reader: JdbcReader = JdbcReader(source, incrementalJob, 10)
//
//    val tableSchema = reader.getTableSchema
//    println(tableSchema)
//    tableSchema.columns.foreach(println)
//    assert(tableSchema != null)
//
//    var count = 0
//    while (reader.hasNext & count < 10) {
//      val records = reader.next
//      println(records)
//      count += records.length
//      records.foreach(row => println(row.mkString(", ")))
//      println(reader.getLastSyncedValue)
//    }
//    println(count)
//
//  }
//}
