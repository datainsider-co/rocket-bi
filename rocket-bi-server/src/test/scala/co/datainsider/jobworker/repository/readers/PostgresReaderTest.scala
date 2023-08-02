// fixme: this test is not working cause no postgres db is available
//package co.datainsider.jobworker.repository.readers
//
//import co.datainsider.bi.client.JdbcClient.Record
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.domain.source.JdbcSource
//import co.datainsider.jobworker.repository.JdbcReader
//import co.datainsider.bi.util.ZConfig
//import com.twitter.inject.Test
//
//class PostgresReaderTest extends Test {
//
//  val jdbcUrl: String = ZConfig.getString("test_db.postgres.url")
//  val username: String = ZConfig.getString("test_db.postgres.username")
//  val password: String = ZConfig.getString("test_db.postgres.password")
//
//  val dbName = "public"
//  val tblName = "student"
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    1,
//    "postgres test",
//    DatabaseType.Postgres,
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
//    databaseName = dbName,
//    tableName = tblName,
//    destinations = Seq(DataDestination.Clickhouse),
//    incrementalColumn = None,
//    lastSyncedValue = "0",
//    jobType = JobType.Jdbc,
//    currentSyncStatus = JobStatus.Init,
//    maxFetchSize = 0,
//    query = None
//  )
//
//  test("test postgre simple reader") { // TODO: wrong test case??
//    val batchSize: Int = 1000
//    val reader: JdbcReader = JdbcReader(source, job, batchSize)
//
//    val t1 = System.currentTimeMillis()
//
//    val tableSchema = reader.getTableSchema
//    tableSchema.columns.foreach(println)
//    assert(tableSchema != null)
//
//    var rowCount = 0
//    while (reader.hasNext) {
//      val records: Seq[Record] = reader.next
//      rowCount += records.length
//      println(rowCount)
//
//      assert(records.nonEmpty)
//      assert(records.size <= batchSize)
//      records.foreach(row => assert(row.size == tableSchema.columns.size))
//    }
//
//    println(s"row count: ${rowCount}")
//    println(s"elapse time: ${System.currentTimeMillis() - t1} ms")
//  }
//
//  test("test postgre incremental reader") {
//    val incrementalJob = job.copy(incrementalColumn = Some("id"), lastSyncedValue = "0") // TODO: add test data
//
//    val reader: JdbcReader = JdbcReader(source, incrementalJob, 5)
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
