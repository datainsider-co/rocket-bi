package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.domain.BigQueryConnection
import co.datainsider.bi.engine.ClientManager
import co.datainsider.bi.module.TestModule
import co.datainsider.jobworker.repository.writer.LocalFileWriterConfig
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.google.cloud.bigquery.{FieldValueList, TableResult}
import com.twitter.inject.Test
import org.scalatest.BeforeAndAfterAll

import java.sql.{Date, Timestamp}
import scala.jdk.CollectionConverters.iterableAsScalaIterableConverter
import scala.util.Try

class BigqueryWriterTest extends Test with BeforeAndAfterAll {

  val localFileWriter = LocalFileWriterConfig(
    baseDir = "./tmp/bigquery",
    fileExtension = "json",
    maxFileSizeInBytes = 1024 * 1024 // 1MB
  )
  val connection: BigQueryConnection = TestModule.providesBigQuerySource()
  val engine = new BigQueryEngine(new ClientManager())
  val bigqueryClient = engine.createClient(connection)
  val bigqueryWriter = new BigqueryWriter(bigqueryClient, localFileWriter, sleepIntervalMs = 500)
  val ddlExecutor = engine.getDDLExecutor(connection)

  val dbName = "bigquery_writer_test"
  val tblName = "students"

  val tableSchema: TableSchema = TableSchema(
    name = tblName,
    dbName = dbName,
    organizationId = 0,
    displayName = "Student table",
    columns = Seq(
      Int32Column("\'id\'", "Id"),
      StringColumn("address", "Address", isNullable = true),
      Int32Column("age", "Age", isNullable = true),
      DateColumn("created_date", "created_date", isNullable = true),
      DateTimeColumn("day_of_birth", "Date of birth", isNullable = true),
      Int32Column("gender", "Gender", isNullable = true),
      FloatColumn("score", "Average score", isNullable = true),
      StringColumn("email", "Email", isNullable = true)
    )
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    Try(await(ddlExecutor.dropDatabase(dbName)))
    Try(await(ddlExecutor.createDatabase(dbName)))
    await(ddlExecutor.createTable(tableSchema))
  }

  override def afterAll(): Unit = {
    super.afterAll()
    Try(await(ddlExecutor.dropDatabase(dbName)))
  }

  test("test write data to bigquery") {
    val date = Date.valueOf("2021-01-01")
    val dateTime = Timestamp.valueOf("2021-01-01 12:12:12")

    val records = Seq(
      Array(1, "Atlantic", 10, date, date, "1", 7.1, "kiki\"@gmail.com"),
      Array(2, "Pa\"cific", 3, dateTime, dateTime, 0, null, "mimi@gmail.com"),
      Array(3, "1", 7, null, null, 0, 7.3, "momo@gmail.com"),
      Array(4, "Himawari", null, null, date, 0, "7.3", "momo@gmail.com"),
      Array(5, null, null, null, null, null, null, null),
      Array(6, null, null, date.getTime, date.getTime, null, null, null),
      Array(7, null, null, dateTime.getTime, dateTime.getTime, null, null, null)
    )

    bigqueryWriter.insertBatch(records, tableSchema)
    bigqueryWriter.close()

    val tableResult: TableResult =
      bigqueryClient.query(s"""select * from $dbName.$tblName order by `'id'` """)(tableResult => tableResult)
    val rows: Seq[FieldValueList] = tableResult.iterateAll().asScala.toSeq
    assert(rows.size == 7)
    assertRow(rows(0), Seq("1", "Atlantic", "10", "2021-01-01", "2021-01-01T00:00:00", "1", "7.1", "kiki\"@gmail.com"))
    assertRow(rows(1), Seq("2", "Pa\"cific", "3", "2021-01-01", "2021-01-01T12:12:12", "0", null, "mimi@gmail.com"))
    assertRow(rows(2), Seq("3", "1", "7", null, null, "0", "7.3", "momo@gmail.com"))
    assertRow(rows(3), Seq("4", "Himawari", null, null, "2021-01-01T00:00:00", "0", "7.3", "momo@gmail.com"))
    assertRow(rows(4), Seq("5", null, null, null, null, null, null, null))
    assertRow(rows(5), Seq("6", null, null, "2021-01-01", "2021-01-01T00:00:00", null, null, null))
    assertRow(rows(6), Seq("7", null, null, "2021-01-01", "2021-01-01T12:12:12", null, null, null))
  }

  private def assertRow(row: FieldValueList, expected: Seq[Any]): Unit = {
    assert(row.size() == expected.size)
    for (i <- expected.indices) {
      assert(row.get(i).getValue == expected(i))
    }
  }

}
