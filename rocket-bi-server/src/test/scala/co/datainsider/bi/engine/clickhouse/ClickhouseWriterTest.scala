package co.datainsider.bi.engine.clickhouse

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.jobworker.repository.writer.{FileClickhouseWriter, LocalFileWriterConfig}
import co.datainsider.jobworker.util.JsonUtils
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, FloatColumn, Int32Column, StringColumn}
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

import java.sql.Date

class ClickhouseWriterTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(TestContainerModule).create

  val localFileWriter = LocalFileWriterConfig(
    baseDir = "./tmp/clickhouse",
    fileExtension = "json",
    maxFileSizeInBytes = 1024 * 1024 // 1MB
  )
  val connection = injector
    .instance[ClickhouseConnection]
    .copy(
      host = "127.0.0.1"
    )
  val fileClickhouseWriter = new FileClickhouseWriter(connection, localFileWriter, sleepIntervalMs = 500)

  val clickhouseClient = injector.instance[JdbcClient](Names.named("clickhouse"))

  val dbName = "clickhouse_writer_test"
  val tblName = "students"

  override def beforeAll(): Unit = {
    super.beforeAll()
    clickhouseClient.executeUpdate(s"drop database if exists `$dbName`")

    clickhouseClient.executeUpdate(s"create database if not exists `$dbName`")

    clickhouseClient.executeUpdate(s"""
         |create table if not exists `$dbName`.`$tblName`
         |(
         |    `\"\"\"id\"\"\"` UInt32,
         |    `[name]` Nullable(String),
         |    `{address}` Nullable(String),
         |    `age` Nullable(UInt32),
         |    `dob` Nullable(DateTime),
         |    `gender` Nullable(UInt32),
         |    `score` Nullable(Float32),
         |    `email` Nullable(String)
         |)
         |engine = MergeTree()
         |order by tuple()
         |""".stripMargin)

  }

  override def afterAll(): Unit = {
    super.afterAll()

    clickhouseClient.executeUpdate(s"drop database if exists `$dbName`")
  }

  test("test write with different schema") {
    val tableSchema: TableSchema = TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = 0,
      displayName = "Student table",
      columns = Seq(
        Int32Column("\"\"\"id\"\"\"", "Id"),
        StringColumn("[name]", "Name", isNullable = true),
        StringColumn("{address}", "Address", isNullable = true),
        Int32Column("age", "Age", isNullable = true),
        DateTimeColumn("dob", "Date of birth", isNullable = true),
        Int32Column("gender", "Gender", isNullable = true),
        FloatColumn("score", "Average score", isNullable = true),
        StringColumn("email", "Email", isNullable = true)
      )
    )
    val records = Seq(
      Array(1, "kiki", "Atlantic", 10, new Date(System.currentTimeMillis()), "1", 7.1, "kiki\"@gmail.com"),
      Array(2, "mimi", "Pa\"cific", 3, new Date(System.currentTimeMillis()), 0, null, "mimi@gmail.com"),
      Array(3, "mo\"m\"o", "1", 7, null, 0, 7.3, "momo@gmail.com"),
      Array(4, "haha", "Himawari", null, new Date(System.currentTimeMillis()), 0, "7.3", "momo@gmail.com"),
      Array(5, null, null, null, null, null, null, null)
    )

    val lines = records.map(record => JsonUtils.toJson(record, false))
    fileClickhouseWriter.localFileService.writeLines(lines, tableSchema)
    fileClickhouseWriter.localFileService.flushUnfinishedFiles()

    fileClickhouseWriter.insertBatch(records, tableSchema)
    fileClickhouseWriter.close()

    val numInsertedRecords = getTotalRows(dbName, tblName)
    assert(numInsertedRecords == 10)
  }

  private def getTotalRows(dbName: String, tblName: String): Int = {
    clickhouseClient.executeQuery(s"select count(1) from $dbName.$tblName")(rs => {
      if (rs.next()) {
        rs.getInt(1)
      } else 0
    })
  }

}
