//package co.datainsider.jobworker.service.writers
//
//import co.datainsider.bi.client.JdbcClient
//import co.datainsider.bi.module.{TestContainerModule, TestModule}
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.repository.writer.{FileClickhouseWriter, LocalFileWriterImpl}
//import com.google.inject.name.Names
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import co.datainsider.schema.domain.TableSchema
//import co.datainsider.schema.domain.column.{DateTimeColumn, FloatColumn, Int32Column, StringColumn}
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
//import co.datainsider.bi.util.ZConfig
//import co.datainsider.schema.module.MockSchemaClientModule
//import org.scalatest.BeforeAndAfterAll
//
//import java.sql.Date
//
//class LocalFileWriterTest extends IntegrationTest with BeforeAndAfterAll {
//  val localFileWriter = new LocalFileWriterImpl(ZConfig.getConfig("hadoop-writer.local-file-writer"))
//  val fileClickhouseWriter =
//    new FileClickhouseWriter(
//      ZConfig.getConfig("clickhouse-writer")
//    ) // TODO: move to TestModule to test with TestContainer
//
//  override protected def injector: Injector = TestInjector(JobWorkerTestModule, TestContainerModule, MockSchemaClientModule, MockLakeClientModule, MockHadoopFileClientModule).newInstance()
//  val clickhouseClient = injector.instance[JdbcClient](Names.named("clickhouse"))
//
//  val dbName = "test"
//  val tblName = "students"
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//
//    clickhouseClient.executeUpdate(s"create database if not exists $dbName")
//
//    clickhouseClient.executeUpdate(s"""
//         |create table if not exists $dbName.$tblName
//         |(
//         |    `\"\"\"id\"\"\"` UInt32,
//         |    `[name]` Nullable(String),
//         |    `{address}` Nullable(String),
//         |    `age` Nullable(UInt32),
//         |    `dob` Nullable(DateTime),
//         |    `gender` Nullable(UInt32),
//         |    `score` Nullable(Float32),
//         |    `email` Nullable(String)
//         |)
//         |engine = MergeTree()
//         |order by tuple()
//         |""".stripMargin)
//
//  }
//
//  override def afterAll(): Unit = {
//    super.afterAll()
//
//    clickhouseClient.executeUpdate(s"drop table $dbName.$tblName")
//  }
//
//  test("test write with different schema") {
//    val tableSchema: TableSchema = TableSchema(
//      name = tblName,
//      dbName = dbName,
//      organizationId = 0,
//      displayName = "Student table",
//      columns = Seq(
//        Int32Column("\"\"\"id\"\"\"", "Id"),
//        StringColumn("[name]", "Name", isNullable = true),
//        StringColumn("{address}", "Address", isNullable = true),
//        Int32Column("age", "Age", isNullable = true),
//        DateTimeColumn("dob", "Date of birth", isNullable = true),
//        Int32Column("gender", "Gender", isNullable = true),
//        FloatColumn("score", "Average score", isNullable = true),
//        StringColumn("email", "Email", isNullable = true)
//      )
//    )
//    val records = Seq(
//      Array(1, "kiki", "Atlantic", 10, new Date(System.currentTimeMillis()), "1", 7.1, "kiki\"@gmail.com"),
//      Array(2, "mimi", "Pa\"cific", 3, new Date(System.currentTimeMillis()), 0, null, "mimi@gmail.com"),
//      Array(3, "mo\"m\"o", "1", 7, null, 0, 7.3, "momo@gmail.com"),
//      Array(4, "haha", "Himawari", null, new Date(System.currentTimeMillis()), 0, "7.3", "momo@gmail.com"),
//      Array(5, null, null, null, null, null, null, null)
//    )
//
//    localFileWriter.writeLine(records, tableSchema)
//    localFileWriter.flushUnfinishedFiles()
//
//    fileClickhouseWriter.write(records, tableSchema)
//    fileClickhouseWriter.finishing()
//
//    val numInsertedRecords = getTotalRows(dbName, tblName)
//    assert(numInsertedRecords == records.length)
//  }
//
//  private def getTotalRows(dbName: String, tblName: String): Int = {
//    clickhouseClient.executeQuery(s"select count(1) from $dbName.$tblName")(rs => {
//      if (rs.next()) {
//        rs.getInt(1)
//      } else 0
//    })
//  }
//
//}
