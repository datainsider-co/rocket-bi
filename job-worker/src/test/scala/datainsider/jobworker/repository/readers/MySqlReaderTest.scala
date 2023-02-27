package datainsider.jobworker.repository.readers

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.schema.column.{Column, DoubleColumn}
import datainsider.client.module.MockSchemaClientModule
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.repository.JdbcReader
import datainsider.jobworker.util.ZConfig
import org.scalatest.BeforeAndAfterAll

class MySqlReaderTest extends IntegrationTest with BeforeAndAfterAll {

  override protected val injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()

  val jdbcUrl: String = ZConfig.getString("database_test.mysql.url")
  val username: String = ZConfig.getString("database_test.mysql.username")
  val password: String = ZConfig.getString("database_test.mysql.password")

  val source: JdbcSource = JdbcSource(
    1,
    id = 0L,
    displayName = "local MySql",
    databaseType = DatabaseType.MySql,
    jdbcUrl = jdbcUrl,
    username = username,
    password = password
  )

  val job: JdbcJob = JdbcJob(
    1,
    jobId = 1,
    sourceId = 1L,
    lastSyncStatus = JobStatus.Init,
    lastSuccessfulSync = 0L,
    syncIntervalInMn = 1,
    databaseName = "highschool",
    tableName = "student",
    incrementalColumn = None,
    destinations = Seq(DataDestination.Clickhouse),
    lastSyncedValue = "0",
    jobType = JobType.Jdbc,
    currentSyncStatus = JobStatus.Init,
    maxFetchSize = 1000,
    query = None
  )

  test("test mysql simple reader") {
    val reader: JdbcReader = JdbcReader(source, job, 5)

    val tableSchema = reader.getTableSchema
    println(tableSchema)
    tableSchema.columns.foreach(println)
    assert(tableSchema != null)

    var count = 0
    while (reader.hasNext & count < 20) {
      val records = reader.next
      assert(records.nonEmpty)
      count += records.length
      records.foreach(row => println(row.mkString(", ")))
      println(reader.getLastSyncedValue)
    }
    println(count)
  }

  test("test mysql incremental reader") {
    val incrementalJob = job.copy(incrementalColumn = Some("id"), lastSyncedValue = "2") // TODO: add test data

    val reader: JdbcReader = JdbcReader(source, incrementalJob, 10)

    val tableSchema = reader.getTableSchema
    println(tableSchema)
    tableSchema.columns.foreach(println)
    assert(tableSchema != null)

    var count = 0
    while (reader.hasNext & count < 6) {
      val records = reader.next
      assert(records.nonEmpty)
      count += records.length
      records.foreach(row => println(row.mkString(", ")))
      println(reader.getLastSyncedValue)
    }
    println(count)

  }

  test("test read decimal column") {
    val dbName = "test_db"
    val tblName = "test_decimal"
    val columns = Map("id" -> "bigint(20)", "data" -> "DECIMAL(6,4)")
    val data = Seq(
      Seq(1, 0),
      Seq(2, 12.34),
      Seq(3, 10.00)
    )
    fakeMysqlTable(dbName, tblName, columns, data)

    val job: JdbcJob = JdbcJob(
      1,
      jobId = 1,
      sourceId = 1L,
      lastSyncStatus = JobStatus.Init,
      lastSuccessfulSync = 0L,
      syncIntervalInMn = 1,
      databaseName = dbName,
      tableName = tblName,
      incrementalColumn = None,
      destinations = Seq(DataDestination.Clickhouse),
      lastSyncedValue = "0",
      jobType = JobType.Jdbc,
      currentSyncStatus = JobStatus.Init,
      maxFetchSize = 1000,
      query = None
    )

    val reader: JdbcReader = JdbcReader(source, job, 5)

    val tableSchema = reader.getTableSchema
    val actualColumn: Option[Column] = tableSchema.findColumn("data")
    assert(actualColumn.nonEmpty)
    assert(actualColumn.get.isInstanceOf[DoubleColumn])

    val expectedData: Seq[Double] = data.map(_.last.toString.toDouble)

    while (reader.hasNext) {
      val records = reader.next
      assert(records.length.equals(data.length))
      val actualData = records.map(_.last.toString.toDouble)
      actualData.foreach(item => expectedData.contains(item))
    }
  }

  private def fakeMysqlTable(dbName: String, tblName: String, columns: Map[String, String], data: Seq[Record]): Unit = {
    val jdbcUrl: String = ZConfig.getString("database_test.mysql.url")
    val username: String = ZConfig.getString("database_test.mysql.username")
    val password: String = ZConfig.getString("database_test.mysql.password")
    val client: JdbcClient = NativeJdbcClient(jdbcUrl = jdbcUrl, username = username, password = password)

    val columnNames: Seq[String] = columns.keys.toSeq
    val createColumnDDL: String =
      columnNames.map(columnName => columnName + " " + columns.getOrElse(columnName, "varchar(50)")).mkString(",")

    client.executeUpdate(s"create database if not exists $dbName")
    client.executeUpdate(s"""
         |create table $dbName.$tblName (
         |$createColumnDDL
         |)
         |""".stripMargin)
    client.executeBatchUpdate(
      s"insert into $dbName.$tblName values(${Array.fill(columnNames.length)("?").mkString(",")})",
      data
    )
  }

}
