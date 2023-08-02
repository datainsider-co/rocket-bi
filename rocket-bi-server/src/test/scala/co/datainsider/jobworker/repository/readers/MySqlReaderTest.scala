//package co.datainsider.jobworker.repository.readers
//
//import co.datainsider.bi.client.JdbcClient.Record
//import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.bi.util.ZConfig
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.domain.source.JdbcSource
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.repository.JdbcReader
//import co.datainsider.schema.domain.column.{Column, DoubleColumn}
//import co.datainsider.schema.module
//import co.datainsider.schema.module.MockSchemaClientModule
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
//import org.scalatest.BeforeAndAfterAll
//
//class MySqlReaderTest extends IntegrationTest with BeforeAndAfterAll {
//
//  override protected val injector: Injector = TestInjector(JobWorkerTestModule, TestContainerModule, MockSchemaClientModule, MockHadoopFileClientModule, MockLakeClientModule).newInstance()
//
//  val jdbcUrl: String = ZConfig.getString("test_db.mysql.url")
//  val username: String = ZConfig.getString("test_db.mysql.username")
//  val password: String = ZConfig.getString("test_db.mysql.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    id = 0L,
//    displayName = "local MySql",
//    databaseType = DatabaseType.MySql,
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
//    databaseName = "testing_db",
//    tableName = "table_test",
//    incrementalColumn = None,
//    destinations = Seq(DataDestination.Clickhouse),
//    lastSyncedValue = "0",
//    jobType = JobType.Jdbc,
//    currentSyncStatus = JobStatus.Init,
//    maxFetchSize = 1000,
//    query = None
//  )
//
//  test("test mysql simple reader") {
//    val dbName = job.databaseName
//    val tblName = job.tableName
//    val dataTypeMap = Map("id" -> "bigint(20)", "data" -> "DECIMAL(6,4)")
//    val columnNames = Seq("id", "data")
//    val data: Seq[Record] = Seq(
//      Array(1, 0),
//      Array(2, 12.34),
//      Array(3, 10.00)
//    )
//    fakeMysqlTable(dbName, tblName, columnNames, dataTypeMap, data)
//    val reader: JdbcReader = JdbcReader(source, job, 5)
//
//    val tableSchema = reader.getTableSchema
//    println(tableSchema)
//    tableSchema.columns.foreach(println)
//    assert(tableSchema != null)
//
//    var count = 0
//    while (reader.hasNext && count < 20) {
//      val records = reader.next
//      assert(records.nonEmpty)
//      count += records.length
//      records.foreach(row => println(row.mkString(", ")))
//    }
//    assert(count == 3)
//  }
//
//  test("test mysql incremental reader") {
//    val dbName = job.databaseName
//    val tblName = job.tableName
//    val columns = Seq("id", "data")
//    val columnTypeMap = Map("id" -> "bigint(20)", "data" -> "DECIMAL(6,4)")
//    val data: Seq[Record] = Seq(
//      Array(5, 10.00),
//      Array(6, 10.00),
//    )
//    fakeMysqlTable(dbName, tblName, columns, columnTypeMap, data)
//    val incrementalJob = job.copy(incrementalColumn = Some("id"), lastSyncedValue = "3") // TODO: add test data
//
//    val reader: JdbcReader = JdbcReader(source, incrementalJob, 10)
//
//    val tableSchema = reader.getTableSchema
//    tableSchema.columns.foreach(println)
//    assert(tableSchema != null)
//
//    var count = 0
//    while (reader.hasNext) {
//      val records = reader.next
//      count += records.length
//      records.foreach(row => println(row.mkString(", ")))
//    }
//    assert(count == 2)
//    assert(reader.getLastSyncedValue == "6")
//
//  }
//
//  test("test read decimal column") {
//    val dbName = "test_db"
//    val tblName = "test_decimal"
//    val columns = Seq("id", "data")
//    val columnTypMap = Map("id" -> "bigint(20)", "data" -> "DECIMAL(6,4)")
//    val data: Seq[Record] = Seq(
//      Array(1, 0),
//      Array(2, 12.34),
//      Array(3, 10.00)
//    )
//    fakeMysqlTable(dbName, tblName, columns, columnTypMap, data)
//
//    val job: JdbcJob = JdbcJob(
//      1,
//      jobId = 1,
//      sourceId = 1L,
//      lastSyncStatus = JobStatus.Init,
//      lastSuccessfulSync = 0L,
//      syncIntervalInMn = 1,
//      databaseName = dbName,
//      tableName = tblName,
//      incrementalColumn = None,
//      destinations = Seq(DataDestination.Clickhouse),
//      lastSyncedValue = "0",
//      jobType = JobType.Jdbc,
//      currentSyncStatus = JobStatus.Init,
//      maxFetchSize = 1000,
//      query = None
//    )
//
//    val reader: JdbcReader = JdbcReader(source, job, 5)
//
//    val tableSchema = reader.getTableSchema
//    val actualColumn: Option[Column] = tableSchema.findColumn("data")
//    assert(actualColumn.nonEmpty)
//    assert(actualColumn.get.isInstanceOf[DoubleColumn])
//
//    val expectedData: Seq[Double] = data.map(_.last.toString.toDouble)
//
//    while (reader.hasNext) {
//      val records = reader.next
//      assert(records.length.equals(data.length))
//      val actualData = records.map(_.last.toString.toDouble)
//      actualData.foreach(item => expectedData.contains(item))
//    }
//  }
//
//  private def fakeMysqlTable(dbName: String, tblName: String, columnNames: Seq[String], dataTypeMap: Map[String, String], data: Seq[Record]): Unit = {
//    val jdbcUrl: String = ZConfig.getString("test_db.mysql.url")
//    val username: String = ZConfig.getString("test_db.mysql.username")
//    val password: String = ZConfig.getString("test_db.mysql.password")
//    val client: JdbcClient = NativeJDbcClient(jdbcUrl = jdbcUrl, username = username, password = password)
//    val createColumnDDL: String =
//      columnNames.map(columnName => columnName + " " + dataTypeMap.getOrElse(columnName, "varchar(50)")).mkString(",")
//
//    client.executeUpdate(s"create database if not exists $dbName")
//    client.executeUpdate(s"""
//         |create table if not exists $dbName.$tblName (
//         |$createColumnDDL
//         |)
//         |""".stripMargin)
//    client.executeBatchUpdate(
//      s"insert into $dbName.$tblName values(${Array.fill(columnNames.length)("?").mkString(",")})",
//      data.toArray
//    )
//  }
//
//}
