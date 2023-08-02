package co.datainsider.bi.engine.postgresql

import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.jobworker.util.JsonUtils
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import datainsider.client.exception.DbExecuteError

import java.io.File
import java.sql.{Date, Timestamp}
import scala.collection.mutable.ArrayBuffer

class PostgreSqlEngineTest extends BasePostgreSqlTest {

  val baseDir = "./tmp"
  val csvPath = s"${baseDir}/postgres_sales.csv"
  val excelPath = s"${baseDir}/postgres_sales.xlsx"

  val studentsSchema: TableSchema = TableSchema(
    name = "students",
    dbName = dbName,
    organizationId = 0,
    displayName = "Student table",
    columns = Seq(
      Int32Column("id", "Id"),
      StringColumn("address", "Address", isNullable = true),
      Int32Column("age", "Age", isNullable = true),
      DateColumn("created_date", "created_date", isNullable = true),
      DateTimeColumn("day_of_birth", "Date of birth", isNullable = true),
      Int32Column("gender", "Gender", isNullable = true),
      FloatColumn("score", "Average score", isNullable = true),
      StringColumn("email", "Email", isNullable = true),
      StringColumn("country", "Country", isNullable = true)
    )
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    val file = new File(baseDir)
    if (!file.exists()) {
      file.mkdirs()
    }
    await(engine.getDDLExecutor(postgresSource).createTable(studentsSchema))
  }

  test("test export csv") {
    val sql =
      s"""
         |SELECT Region, Total_Profit, Order_Date
         |FROM $dbName.$tblName
         |LIMIT 100
         |""".stripMargin

    val destPath = engine.exportToFile(postgresSource, sql, csvPath, FileType.Csv).syncGet()
    val file = new File(destPath)
    assert(file.exists())
    assert(file.length() > 0)
    file.delete()
  }

  test("test export excel") {
    val sql =
      s"""
         |SELECT Region, Total_Profit, Order_Date
         |FROM $dbName.$tblName
         |LIMIT 100
         |""".stripMargin

    val destPath = engine.exportToFile(postgresSource, sql, excelPath, FileType.Excel).syncGet()
    val file = new File(destPath)
    assert(file.exists())
    assert(file.length() > 0)
    file.delete()
  }

  test("test query histogram") {
    val fieldName = "Total_Profit"
    val baseSql = s"select Total_Profit from $dbName.$tblName"
    val histogramSql = engine.getSqlParser().toHistogramSql(fieldName, baseSql, 5)
    assert(histogramSql != null)

    val dataTable: DataTable = engine.execute(postgresSource, histogramSql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test detect expression column success") {
    val expression = "Total_Profit + 100"
    val column = await(engine.detectExpressionColumn(postgresSource, dbName, tblName, expression, Map.empty))
    assert(column != null)
    assert(column.getClass == classOf[DoubleColumn])
  }

  test("test detect expression column with invalid expression") {
    val expression = "Total_Profit + 100 +"
    assertFailedFuture[DbExecuteError](
      engine.detectExpressionColumn(postgresSource, dbName, tblName, expression, Map.empty)
    )
  }

  test("test detect aggregate expression column success") {
    val expression = "sum(Total_Profit)"
    val column = await(engine.detectAggregateExpressionColumn(postgresSource, dbName, tblName, expression, Map.empty))
    assert(column != null)
    assert(column.getClass == classOf[DoubleColumn])
  }

  test("test detect aggregate expression column with invalid expression") {
    val expression = "sum(Total_Profit) +"
    assertFailedFuture[DbExecuteError](
      engine.detectAggregateExpressionColumn(postgresSource, dbName, tblName, expression, Map.empty)
    )
  }

  test("test write data") {
    val date = Date.valueOf("2021-01-01")
    val dateTime = Timestamp.valueOf("2021-01-01 12:12:12")
    val dateTime2 = Timestamp.valueOf("2021-01-01 12:12:12")

    val records = Seq(
      Array(1, "Atlantic", 10, date, date, 1, 7.1, "kiki\"@gmail.com", null),
      Array(2, "Pa\"cific", 3, dateTime, dateTime, 0, null, "mimi@gmail.com", "Vietnam"),
      Array(3, "1", 7, null, null, 0, 7.3, "momo@gmail.com", "Vietnam"),
      Array(4, "Himawari", null, null, date, 0, 7.3, "momo@gmail.com", null),
      Array(5, null, null, null, null, null, null, null, ""),
      Array(6, null, null, date.getTime, date.getTime, null, null, null, "1"),
      Array(7, null, null, dateTime.getTime, dateTime2.getTime, null, null, null, null)
    )

    await(engine.write(postgresSource, studentsSchema, records))
    val query =
      s"""SELECT *
         |FROM ${studentsSchema.dbName}.${studentsSchema.name}
         |ORDER BY id """.stripMargin
    val actualRows: Seq[Seq[Any]] = client.executeQuery(query)(rs => {
      val records = ArrayBuffer[Seq[Any]]()
      while (rs.next()) {
        val record = ArrayBuffer[Any]()
        for (i <- 1 to rs.getMetaData.getColumnCount) {
          record += rs.getObject(i)
        }
        records += record
      }
      records
    })
    assert(actualRows.size == 7)
    assert(
      actualRows(0),
      Seq(1, "Atlantic", 10, date, Timestamp.valueOf("2021-01-01 00:00:00.0"), 1, 7.1, "kiki\"@gmail.com", null)
    )
    assert(actualRows(1), Seq(2, "Pa\"cific", 3, date, dateTime, 0, null, "mimi@gmail.com", "Vietnam"))
    assert(actualRows(2), Seq(3, "1", 7, null, null, 0, 7.3, "momo@gmail.com", "Vietnam"))
    assert(
      actualRows(3),
      Seq(4, "Himawari", null, null, Timestamp.valueOf("2021-01-01 00:00:00"), 0, 7.3, "momo@gmail.com", null)
    )
    assert(actualRows(4), Seq(5, null, null, null, null, null, null, null, ""))
    assert(actualRows(5), Seq(6, null, null, date, Timestamp.valueOf("2021-01-01 00:00:00.0"), null, null, null, "1"))
    assert(
      actualRows(6),
      Seq(7, null, null, date, Timestamp.valueOf("2021-01-01 12:12:12.000"), null, null, null, null)
    )
  }

  def assert(actualList: Seq[Any], expectedList: Seq[Any]): Unit = {
    assert(JsonUtils.toJson(actualList, false) == JsonUtils.toJson(expectedList, false))
  }
}
