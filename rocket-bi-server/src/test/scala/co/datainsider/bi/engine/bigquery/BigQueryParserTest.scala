package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.client.BigQueryClient
import co.datainsider.bi.domain.BigQueryConnection
import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.ClientManager
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.module.TestModule
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.inject.Test
import datainsider.client.domain.Implicits.FutureEnhanceLike

class BigQueryParserTest extends Test {

  val parser = new QueryParserImpl(BigQueryParser)
  val bqSource: BigQueryConnection = TestModule.providesBigQuerySource()
  val engine: BigQueryEngine = new BigQueryEngine(new ClientManager())
  val ddlExecutor: DDLExecutor = engine.getDDLExecutor(bqSource)
  val bigqueryClient: BigQueryClient = engine.createClient(bqSource)

  val dbName = "test"
  val tblName = "sales"

  val tableSchema = TableSchema(
    name = tblName,
    dbName = dbName,
    organizationId = 1,
    displayName = dbName,
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
    bigqueryClient.loadJsonFile(path, tableSchema.dbName, tableSchema.name)
  }

  override def afterAll(): Unit = {
    super.afterAll()
    ddlExecutor.dropTable(tableSchema.dbName, tableSchema.name).syncGet()
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

  test("test parse select query") {
    val selectRegionCountries = ObjectQuery(
      functions = Seq(
        Select(TableField(dbName, tblName, "Region", "String")),
        Select(TableField(dbName, tblName, "Country", "String"))
      ),
      limit = Some(Limit(offset = 0, size = 10))
    )

    val sql = parser.parse(selectRegionCountries)
    assert(sql.contains("select"))
    assert(sql.contains("Region"))
    assert(sql.contains("Country"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 10)
  }

  test("test parse select distinct query") {
    val selectChannelQuery = ObjectQuery(
      functions = Seq(
        SelectDistinct(TableField(dbName, tblName, "Sales_Channel", "String"))
      )
    )

    val sql = parser.parse(selectChannelQuery)
    assert(sql.contains("select"))
    assert(sql.contains("Sales_Channel"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 2) // Online, Offline
  }

  test("test parse group by query") {
    val selectProfitByRegion = ObjectQuery(
      functions = Seq(
        GroupBy(TableField(dbName, tblName, "Region", "String")),
        Sum(TableField(dbName, tblName, "Total_Profit", "UInt32"))
      )
    )

    val sql = parser.parse(selectProfitByRegion)
    assert(sql.contains("group by"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test parse select count query") {
    val selectCountQuery = ObjectQuery(
      functions = Seq(
        Count(TableField(dbName, tblName, "Order_ID", "String"))
      )
    )

    val sql = parser.parse(selectCountQuery)
    assert(sql.contains("count"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 1)
  }

  test("test parse select count distinct query") {
    val selectCountQuery = ObjectQuery(
      functions = Seq(
        CountDistinct(TableField(dbName, tblName, "Region", "String"))
      )
    )

    val sql = parser.parse(selectCountQuery)
    assert(sql.contains("count"))
    assert(sql.contains("distinct"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 1)
  }

  test("test parse select min query") {
    val selectMinQuery = ObjectQuery(
      functions = Seq(
        Min(TableField(dbName, tblName, "Unit_Cost", "Int64"))
      )
    )

    val sql = parser.parse(selectMinQuery)
    assert(sql.contains("min"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 1)
  }

  test("test parse select max query") {
    val selectMaxQuery = ObjectQuery(
      functions = Seq(
        Max(TableField(dbName, tblName, "Unit_Price", "Int64"))
      )
    )

    val sql = parser.parse(selectMaxQuery)
    assert(sql.contains("max"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 1)
  }

  test("test parse select avg query") {
    val selectAnyValueQuery = ObjectQuery(
      functions = Seq(
        Avg(TableField(dbName, tblName, "Unit_Cost", "String"))
      )
    )

    val sql = parser.parse(selectAnyValueQuery)
    assert(sql.contains("avg"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 1)
  }

  test("test parse select first query") {
    val selectFirstValue = ObjectQuery(
      functions = Seq(
        First(TableField(dbName, tblName, "Total_Revenue", "Int64"))
      )
    )

    val sql = parser.parse(selectFirstValue)
    assert(sql.contains("any_value"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 1)
  }

  test("test parse select last query") {
    val selectLastValue = ObjectQuery(
      functions = Seq(
        First(TableField(dbName, tblName, "Total_Revenue", "Int64"))
      )
    )

    val sql = parser.parse(selectLastValue)
    assert(sql.contains("any_value"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
    assert(dataTable.records.length == 1)
  }

  test("test parse select order by query") {
    val selectWithOrder = ObjectQuery(
      functions = Seq(
        Select(TableField(dbName, tblName, "Order_Date", "DateTime"))
      ),
      orders = Seq(
        OrderBy(Select(TableField(dbName, tblName, "Order_Date", "DateTime")))
      ),
      limit = Some(Limit(offset = 0, size = 10))
    )

    val sql = parser.parse(selectWithOrder)
    assert(sql.contains("order by"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test parse select all query") {
    val selectAllQuery = ObjectQuery(
      functions = Seq(
        SelectAll()
      ),
      limit = Some(Limit(offset = 0, size = 10)),
      queryViews = Seq(TableView(dbName, tblName))
    )

    val sql = parser.parse(selectAllQuery)
    assert(sql.contains("select *"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test parse count all query") {
    val selectCountAllQuery = ObjectQuery(
      functions = Seq(
        CountAll()
      ),
      queryViews = Seq(TableView(dbName, tblName))
    )

    val sql = parser.parse(selectCountAllQuery)
    assert(sql.contains("select count(*)"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test parse select null query") {
    val selectNullQuery = ObjectQuery(
      functions = Seq(
        SelectNull()
      ),
      limit = Some(Limit(offset = 0, size = 10)),
      queryViews = Seq(TableView(dbName, tblName))
    )

    val sql = parser.parse(selectNullQuery)
    assert(sql.contains("null"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test parse histogram query") {
    val fieldName = "Total_Profit"
    val baseSql = s"select Total_Profit from ${dbName}.${tblName}"
    val histogramSql = BigQueryParser.toHistogramSql(fieldName, baseSql, 5)
    assert(histogramSql != null)

    val dataTable: DataTable = engine.execute(bqSource, histogramSql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test parse select expression query") {
    val selectExpressionQuery = ObjectQuery(
      functions = Seq(
        SelectExpression(
          ExpressionField(expression = "Total_Profit / 23000", dbName, tblName, "profit_usd", "UInt64")
        )
      ),
      conditions = Seq(
        LessThan(ExpressionField(expression = "Total_Profit / 23000", dbName, tblName, "profit_usd", "UInt64"), "10")
      ),
      limit = Some(Limit(offset = 0, size = 10)),
      queryViews = Seq(TableView(dbName, tblName))
    )

    val sql = parser.parse(selectExpressionQuery)
    println(sql)
    assert(sql.contains("Total_Profit / 23000"))

    val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test parse date scalar functions") {
    val scalarFunctions: Seq[ScalarFunction] = Seq(
      ToYear(),
      ToQuarter(),
      ToMonth(),
      ToWeek(),
      ToDate(),
      ToDateTime(),
      SecondsToDateTime(Some(DatetimeToSeconds())),
      MillisToDateTime(Some(DatetimeToMillis())),
      NanosToDateTime(Some(DatetimeToNanos())),
      ToDayOfYear(),
      ToDayOfMonth(),
      ToDayOfWeek(),
      ToHour(),
      ToMinute(),
      ToSecond(),
      ToYearNum(),
      ToQuarterNum(),
      ToMonthNum(),
      ToWeekNum(),
      ToDayNum(),
      ToHourNum(),
      ToMinuteNum(),
      ToSecondNum(),
      DateDiff("MONTH", "2000-01-01"),
      PastNYear(1),
      PastNQuarter(1),
      PastNMonth(1),
      PastNWeek(1),
      PastNDay(1),
      Cast("STRING")
    )

    scalarFunctions.foreach(scalarFunction => {
      val selectWithScalarFunc = ObjectQuery(
        functions = Seq(
          GroupBy(
            field = TableField(dbName, tblName, "Order_Date", "Date"),
            scalarFunction = Some(scalarFunction)
          )
        ),
        limit = Some(Limit(0, 10)),
        queryViews = Seq(TableView(dbName, tblName))
      )

      val sql = parser.parse(selectWithScalarFunc)

      val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
      assert(dataTable.headers.nonEmpty)
      assert(dataTable.records.nonEmpty)
    })

  }

  test("test parse date range conditions") {
    val conditions = Seq(
      LastNMinute(TableField(dbName, tblName, "Order_Date", "Date"), 1),
      LastNHour(TableField(dbName, tblName, "Order_Date", "Date"), 1),
      LastNDay(TableField(dbName, tblName, "Order_Date", "Date"), 1),
      LastNWeek(TableField(dbName, tblName, "Order_Date", "Date"), 1),
      LastNMonth(TableField(dbName, tblName, "Order_Date", "Date"), 1),
      LastNQuarter(TableField(dbName, tblName, "Order_Date", "Date"), 1),
      LastNYear(TableField(dbName, tblName, "Order_Date", "Date"), 1),
      CurrentDay(TableField(dbName, tblName, "Order_Date", "Date")),
      CurrentWeek(TableField(dbName, tblName, "Order_Date", "Date")),
      CurrentMonth(TableField(dbName, tblName, "Order_Date", "Date")),
      CurrentQuarter(TableField(dbName, tblName, "Order_Date", "Date")),
      CurrentYear(TableField(dbName, tblName, "Order_Date", "Date"))
    )

    conditions.foreach(condition => {
      val selectWithCondition = ObjectQuery(
        functions = Seq(Select(field = TableField(dbName, tblName, "Order_Date", "Date"))),
        conditions = Seq(condition),
        limit = Some(Limit(0, 10))
      )

      val sql = parser.parse(selectWithCondition)

      val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
      assert(dataTable.headers.nonEmpty)
    })
  }

  test("test parse comparison conditions") {
    val profitField = TableField(dbName, tblName, "Total_Profit", "Double")
    val regionField = TableField(dbName, tblName, "Region", "String")

    val conditions = Seq(
      Empty(regionField),
      NotEmpty(regionField),
      Null(profitField),
      NotNull(profitField),
      Equal(profitField, "100"),
      NotEqual(profitField, "100"),
      GreaterThan(profitField, "100"),
      GreaterThanOrEqual(profitField, "100"),
      LessThan(profitField, "100"),
      LessThanOrEqual(profitField, "100"),
      MatchRegex(regionField, "Asia"),
      Like(regionField, "Asia"),
      NotLike(regionField, "Asia"),
      LikeCaseInsensitive(regionField, "Asia"),
      NotLikeCaseInsensitive(regionField, "Asia"),
      Between(profitField, "100", "200"),
      BetweenAndIncluding(profitField, "100", "200"),
      In(regionField, Set("Asia", "Europe")),
      NotIn(regionField, Set("Asia", "Europe"))
    )

    conditions.foreach(condition => {
      val selectWithCondition = ObjectQuery(
        functions = Seq(Select(field = regionField), Select(field = profitField)),
        conditions = Seq(condition),
        limit = Some(Limit(0, 10))
      )

      val sql = parser.parse(selectWithCondition)
      val dataTable: DataTable = engine.execute(bqSource, sql).syncGet()
      assert(dataTable.headers.nonEmpty)
    })
  }

}
