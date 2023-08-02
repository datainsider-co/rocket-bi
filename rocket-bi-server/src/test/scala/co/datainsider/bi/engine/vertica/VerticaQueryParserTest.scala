package co.datainsider.bi.engine.vertica

import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.clickhouse.DataTable

class VerticaQueryParserTest extends BaseVerticaTest {
  val parser = new QueryParserImpl(VerticaParser)

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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    val dataTable: DataTable = await(engine.execute(source, sql))
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

    assert(sql.contains("Total_Profit / 23000"))

    val dataTable: DataTable = await(engine.execute(source, sql))
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
      Cast("CHAR")
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
      val dataTable: DataTable = await(engine.execute(source, sql))
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

      val dataTable: DataTable = await(engine.execute(source, sql))
      assert(dataTable.headers.nonEmpty)
    })
  }

  test("test parse string conditions") {
    val field = TableField(dbName, tblName, "Region", "string")
    val conditions: Seq[Condition] = Seq(
      Null(field),
      NotNull(field),
      Empty(field),
      NotEmpty(field),
      Equal(field, "Asia"),
      NotEqual(field, "Asia"),
      MatchRegex(field, "Asia"),
      Like(field, "Asia"),
      NotLike(field, "Asia"),
      LikeCaseInsensitive(field, "Asia"),
      NotLikeCaseInsensitive(field, "Asia"),
      In(field, Set("Asia", "Europe")),
      NotIn(field, Set("Asia", "Europe")),
      AlwaysTrue(),
      AlwaysFalse(),
      And(Array(AlwaysTrue(), AlwaysFalse(), NotLike(field, "Asia"))),
      Or(Array(AlwaysTrue(), AlwaysFalse(), Like(field, "Asia")))
    )

    conditions.foreach(condition => {
      val selectWithCondition = ObjectQuery(
        functions = Seq(Select(field)),
        conditions = Seq(condition),
        limit = Some(Limit(0, 10))
      )
      val sql = parser.parse(selectWithCondition)

      val dataTable: DataTable = await(engine.execute(source, sql))
      assert(dataTable.headers.nonEmpty)
    })
  }

  test("test parse number conditions") {
    val field = TableField(dbName, tblName, "Total_Profit", "Int64")
    val conditions: Seq[Condition] = Seq(
      Null(field),
      NotNull(field),
      Equal(field, "100"),
      NotEqual(field, "100"),
      GreaterThan(field, "100"),
      GreaterThanOrEqual(field, "100"),
      LessThan(field, "100"),
      LessThanOrEqual(field, "100"),
      In(field, Set("100", "200")),
      NotIn(field, Set("100", "200")),
      Between(field, "100", "200"),
      BetweenAndIncluding(field, "100", "200"),
      AlwaysTrue(),
      AlwaysFalse(),
      And(Array(AlwaysTrue(), AlwaysFalse(), Equal(field, "100"))),
      Or(Array(AlwaysTrue(), AlwaysFalse(), Equal(field, "100")))
    )
    conditions.foreach(condition => {
      val selectWithCondition = ObjectQuery(
        functions = Seq(Select(field)),
        conditions = Seq(condition),
        limit = Some(Limit(0, 10))
      )
      val sql = parser.parse(selectWithCondition)

      val dataTable: DataTable = await(engine.execute(source, sql))
      assert(dataTable.headers.nonEmpty)
    })
  }
}
