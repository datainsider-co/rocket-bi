//fixme: this test is not working cause no oracle db is available
//package co.datainsider.jobworker.repository.readers
//
//import co.datainsider.jobworker.domain.source.JdbcSource
//import co.datainsider.jobworker.domain.{DatabaseType, JdbcJob, JobStatus, JobType}
//import co.datainsider.jobworker.repository.JdbcReader
//import co.datainsider.bi.util.ZConfig
//import com.twitter.inject.Test
//
//class OracleReaderTest extends Test {
//
//  val jdbcUrl: String = ZConfig.getString("test_db.oracle.url")
//  val username: String = ZConfig.getString("test_db.oracle.username")
//  val password: String = ZConfig.getString("test_db.oracle.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    1,
//    "DI Oracle",
//    DatabaseType.Oracle,
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
//    databaseName = "TVC12",
//    tableName = "SALES_1M",
//    destDatabaseName = "highschool",
//    destTableName = "student",
//    destinations = Seq.empty,
//    incrementalColumn = None,
//    lastSyncedValue = "0",
//    jobType = JobType.Jdbc,
//    currentSyncStatus = JobStatus.Init,
//    maxFetchSize = 1000,
//    query = None
//  )
//
//  test("test oracle simple reader") {
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
//  test("test oracle incremental reader") {
//    val incrementalJob = job.copy(incrementalColumn = Some("Order ID"), lastSyncedValue = "0")
//
//    val reader: JdbcReader = JdbcReader(source, incrementalJob, 10)
//
//    val tableSchema = reader.getTableSchema
//    println(tableSchema)
//    tableSchema.columns.foreach(println)
//    assert(tableSchema != null)
//
//    var count = 0
//    while (reader.hasNext & count < 6) {
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
