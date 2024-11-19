package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.domain.BigQueryConnection
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.bi.util.Using
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.twitter.inject.Test

import java.io.File
import scala.util.Try

class BigQueryEngineTest extends Test {
  val bqSource: BigQueryConnection = TestModule.providesBigQuerySource()
  val bigqueryEngineCreator = new BigQueryEngineFactory()

  val engine = bigqueryEngineCreator.create(bqSource)
  val ddlExecutor = engine.getDDLExecutor()
  val tableSchema = TableSchema(
    name = "sales",
    dbName = "test",
    organizationId = 1,
    displayName = "sales",
    columns = Seq(
      StringColumn("Region", "Region", isNullable = true),
      StringColumn("Country", "Country", isNullable = true),
      StringColumn("Item_Type", "Item Type", isNullable = true),
      StringColumn("Sales_Channel", "Sales_Channel", isNullable = true),
      StringColumn("Order_Priority", "Order_Priority", isNullable = true),
      DateTimeColumn("Order_Date", "Order_Date", isNullable = true),
      StringColumn("Order_ID", "Order_ID", isNullable = true),
      DateTimeColumn("Ship_Date", "Ship_Date", isNullable = true),
      Int32Column("Units_Sold", "Units_Sold", isNullable = true),
      FloatColumn("Unit_Price", "Unit_Price", isNullable = true),
      FloatColumn("Unit_Cost", "Unit_Cost", isNullable = true),
      FloatColumn("Total_Revenue", "Total_Revenue", isNullable = true),
      FloatColumn("Total_Cost", "Total_Cost", isNullable = true),
      FloatColumn("Total_Profit", "Total_Profit", isNullable = true)
    )
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    ensureTableExists(tableSchema)
    val path: String = getClass.getClassLoader.getResource("datasets/sales_100records").getPath
    engine.client.loadJsonFile(path, tableSchema.dbName, tableSchema.name)
  }

  override def afterAll(): Unit = {
    super.afterAll()
    ddlExecutor.dropTable(tableSchema.dbName, tableSchema.name).syncGet()
    Try(engine.close())
  }

  private def ensureTableExists(tableSchema: TableSchema): Unit = {
    if (!ddlExecutor.existsDatabaseSchema(tableSchema.dbName).syncGet()) {
      ddlExecutor.createDatabase(tableSchema.dbName).syncGet()
    }
    if (ddlExecutor.existTableSchema(tableSchema.dbName, tableSchema.name).syncGet()) {
      ddlExecutor.dropTable(tableSchema.dbName, tableSchema.name).syncGet()
    }
    ddlExecutor.createTable(tableSchema).syncGet()
  }

  test("test connection success") {
    val isSuccess: Boolean = await(engine.testConnection())
    assert(isSuccess)
  }

  test("test connection failed") {
    val source = bqSource.copy(projectId = "wrong_project_id")
    Using(bigqueryEngineCreator.create(source)) { engine =>
      assertFailedFuture[Throwable](engine.testConnection())
    }
  }

  test("test query from external project") {
    val sql =
      s"""
         |SELECT
         |  CONCAT(
         |    'https://stackoverflow.com/questions/',
         |    CAST(id as STRING)
         |  ) as url,
         |  view_count
         |FROM `bigquery-public-data`.`stackoverflow`.`posts_questions` as b
         |WHERE tags like '%google-bigquery%'
         |ORDER BY view_count DESC
         |LIMIT 10
         |""".stripMargin

    val dataTable: DataTable = engine.execute(sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test query with aggregation") {
    val sql =
      s"""
         |SELECT Region, sum(Total_Profit) as Sum_Profit
         |FROM test.sales
         |GROUP BY Region
         |""".stripMargin

    val dataTable: DataTable = engine.execute(sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test query date column") {
    val sql =
      s"""
         |SELECT Order_Date
         |FROM test.sales
         |LIMIT 10
         |""".stripMargin

    val dataTable: DataTable = engine.execute(sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test export to csv") {
    val sql =
      s"""
         |SELECT Region, Total_Profit, Order_Date
         |FROM test.sales
         |LIMIT 100
         |""".stripMargin

    val destPath = engine.exportToFile(sql, "./bq_sales.csv", FileType.Csv).syncGet()
    val file = new File(destPath)
    assert(file.exists())
    assert(file.length() > 0)
    file.delete()
  }

  test("test export to excel") {
    val sql =
      s"""
         |SELECT Region, Total_Profit, Order_Date
         |FROM test.sales
         |LIMIT 100
         |""".stripMargin

    val destPath = engine.exportToFile(sql, "./bq_sales.xlsx", FileType.Excel).syncGet()
    val file = new File(destPath)
    assert(file.exists())
    assert(file.length() > 0)
    file.delete()
  }

  test("test execute histogram query") {
    val fieldName = "Total_Profit"
    val baseSql = s"select Total_Profit from test.sales"
    val histogramSql = BigQueryParser.toHistogramSql(fieldName, baseSql, 5)
    assert(histogramSql != null)

    val dataTable: DataTable = engine.execute(histogramSql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test write data to big query") {
    val sql =
      s"""
         |SELECT ${tableSchema.columns.map(_.name).mkString(", ")}
         |FROM test.sales
         |LIMIT 100
         |""".stripMargin

    val dataTable: DataTable = engine.execute(sql).syncGet()

    val records = dataTable.records.map(row => row.asInstanceOf[Array[Any]]).toSeq
    val insertedRows = engine.write(tableSchema, records).syncGet()
    assert(insertedRows == records.length)
  }

}
