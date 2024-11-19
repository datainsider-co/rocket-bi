//package co.datainsider.bi.engine.redshift
//
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.common.client.exception.{InternalError, UnsupportedError}
//import co.datainsider.schema.domain.TableType.TableType
//import co.datainsider.schema.domain.column._
//import co.datainsider.schema.domain.{TableSchema, TableType}
//import com.twitter.inject.Test
//import com.twitter.inject.app.TestInjector
//import org.scalatest.exceptions.TestFailedException//package co.datainsider.bi.engine.redshift
//
//import co.datainsider.bi.domain.query._
//import co.datainsider.bi.engine.clickhouse.DataTable
//import co.datainsider.bi.util.Implicits.FutureEnhance
//
//class RedshiftQueryParserTest extends BaseRedshiftTest {
//  val parser = new QueryParserImpl(RedshiftParser)
//
//  test("test parse select query") {
//    val selectRegionCountries = ObjectQuery(
//      functions = Seq(
//        Select(TableField(dbName, tblName, "Region", "String")),
//        Select(TableField(dbName, tblName, "Country", "String"))
//      ),
//      limit = Some(Limit(offset = 0, size = 10))
//    )
//
//    val sql = parser.parse(selectRegionCountries)
//    assert(sql.contains("select"))
//    assert(sql.contains("Region"))
//    assert(sql.contains("Country"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 10)
//  }
//
//  test("test parse select distinct query") {
//    val selectChannelQuery = ObjectQuery(
//      functions = Seq(
//        SelectDistinct(TableField(dbName, tblName, "Sales_Channel", "String"))
//      )
//    )
//
//    val sql = parser.parse(selectChannelQuery)
//
//    assert(sql.contains("select"))
//    assert(sql.contains("Sales_Channel"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 2) // Online, Offline
//  }
//
//  test("test parse group by query") {
//    val selectProfitByRegion = ObjectQuery(
//      functions = Seq(
//        GroupBy(TableField(dbName, tblName, "Region", "String")),
//        Sum(TableField(dbName, tblName, "Total_Profit", "UInt32"))
//      )
//    )
//
//    val sql = parser.parse(selectProfitByRegion)
//    assert(sql.contains("group by"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//  }
//
//  test("test parse select count query") {
//    val selectCountQuery = ObjectQuery(
//      functions = Seq(
//        Count(TableField(dbName, tblName, "Order_ID", "String"))
//      )
//    )
//
//    val sql = parser.parse(selectCountQuery)
//    assert(sql.contains("count"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 1)
//  }
//
//  test("test parse select count distinct query") {
//    val selectCountQuery = ObjectQuery(
//      functions = Seq(
//        CountDistinct(TableField(dbName, tblName, "Region", "String"))
//      )
//    )
//
//    val sql = parser.parse(selectCountQuery)
//    assert(sql.contains("count"))
//    assert(sql.contains("distinct"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 1)
//  }
//
//  test("test parse select min query") {
//    val selectMinQuery = ObjectQuery(
//      functions = Seq(
//        Min(TableField(dbName, tblName, "Unit_Cost", "Int64"))
//      )
//    )
//
//    val sql = parser.parse(selectMinQuery)
//    assert(sql.contains("min"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 1)
//  }
//
//  test("test parse select max query") {
//    val selectMaxQuery = ObjectQuery(
//      functions = Seq(
//        Max(TableField(dbName, tblName, "Unit_Price", "Int64"))
//      )
//    )
//
//    val sql = parser.parse(selectMaxQuery)
//    assert(sql.contains("max"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 1)
//  }
//
//  test("test parse select avg query") {
//    val selectAnyValueQuery = ObjectQuery(
//      functions = Seq(
//        Avg(TableField(dbName, tblName, "Unit_Cost", "String"))
//      )
//    )
//
//    val sql = parser.parse(selectAnyValueQuery)
//    assert(sql.contains("avg"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 1)
//  }
//
//  test("test parse select first query") {
//    val selectFirstValue = ObjectQuery(
//      functions = Seq(
//        First(TableField(dbName, tblName, "Total_Revenue", "Int64"))
//      )
//    )
//
//    val sql = parser.parse(selectFirstValue)
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 1)
//  }
//
//  test("test parse select last query") {
//    val selectLastValue = ObjectQuery(
//      functions = Seq(
//        First(TableField(dbName, tblName, "Total_Revenue", "Int64"))
//      )
//    )
//
//    val sql = parser.parse(selectLastValue)
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//    assert(dataTable.records.length == 1)
//  }
//
//  test("test parse select order by query") {
//    val selectWithOrder = ObjectQuery(
//      functions = Seq(
//        Select(TableField(dbName, tblName, "Order_Date", "DateTime"))
//      ),
//      orders = Seq(
//        OrderBy(Select(TableField(dbName, tblName, "Order_Date", "DateTime")))
//      ),
//      limit = Some(Limit(offset = 0, size = 10))
//    )
//
//    val sql = parser.parse(selectWithOrder)
//    assert(sql.contains("order by"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//  }
//
//  test("test parse select all query") {
//    val selectAllQuery = ObjectQuery(
//      functions = Seq(
//        SelectAll()
//      ),
//      limit = Some(Limit(offset = 0, size = 10)),
//      queryViews = Seq(TableView(dbName, tblName))
//    )
//
//    val sql = parser.parse(selectAllQuery)
//    assert(sql.contains("select *"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//  }
//
//  test("test parse count all query") {
//    val selectCountAllQuery = ObjectQuery(
//      functions = Seq(
//        CountAll()
//      ),
//      queryViews = Seq(TableView(dbName, tblName))
//    )
//
//    val sql = parser.parse(selectCountAllQuery)
//    assert(sql.contains("select count(*)"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//  }
//
//  test("test parse select null query") {
//    val selectNullQuery = ObjectQuery(
//      functions = Seq(
//        SelectNull()
//      ),
//      limit = Some(Limit(offset = 0, size = 10)),
//      queryViews = Seq(TableView(dbName, tblName))
//    )
//
//    val sql = parser.parse(selectNullQuery)
//    assert(sql.contains("null"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//  }
//
//  test("test parse select expression query") {
//    val selectExpressionQuery = ObjectQuery(
//      functions = Seq(
//        SelectExpression(
//          ExpressionField(expression = "Total_Profit / 23000", dbName, tblName, "profit_usd", "UInt64")
//        )
//      ),
//      conditions = Seq(
//        LessThan(ExpressionField(expression = "Total_Profit / 23000", dbName, tblName, "profit_usd", "UInt64"), "10")
//      ),
//      limit = Some(Limit(offset = 0, size = 10)),
//      queryViews = Seq(TableView(dbName, tblName))
//    )
//
//    val sql = parser.parse(selectExpressionQuery)
//
//    assert(sql.contains("Total_Profit / 23000"))
//
//    val dataTable: DataTable = engine.execute(sql).syncGet()
//    assert(dataTable.headers.nonEmpty)
//    assert(dataTable.records.nonEmpty)
//  }
//
//  test("test parse date scalar functions") {
//    val scalarFunctions: Seq[ScalarFunction] = Seq(
//      ToYear(),
//      ToQuarter(),
//      ToMonth(),
//      ToWeek(),
//      ToDate(),
//      ToDateTime(),
//      SecondsToDateTime(Some(DatetimeToSeconds())),
//      MillisToDateTime(Some(DatetimeToMillis())),
//      NanosToDateTime(Some(DatetimeToNanos())),
//      ToDayOfYear(),
//      ToDayOfMonth(),
//      ToDayOfWeek(),
//      ToHour(),
//      ToMinute(),
//      ToSecond(),
//      ToYearNum(),
//      ToQuarterNum(),
//      ToMonthNum(),
//      ToWeekNum(),
//      ToDayNum(),
//      ToHourNum(),
//      ToMinuteNum(),
//      ToSecondNum(),
////      DateDiff("MONTH", "2000-01-01"),
//      PastNYear(1),
//      PastNQuarter(1),
//      PastNMonth(1),
//      PastNWeek(1),
//      PastNDay(1),
//      Cast("CHAR")
//    )
//
//    scalarFunctions.foreach(scalarFunction => {
//      val selectWithScalarFunc = ObjectQuery(
//        functions = Seq(
//          GroupBy(
//            field = TableField(dbName, tblName, "Order_Date", "Date"),
//            scalarFunction = Some(scalarFunction)
//          )
//        ),
//        limit = Some(Limit(0, 10)),
//        queryViews = Seq(TableView(dbName, tblName))
//      )
//
//      val sql = parser.parse(selectWithScalarFunc)
//
//      val dataTable: DataTable = engine.execute(sql).syncGet()
//      assert(dataTable.headers.nonEmpty)
//      assert(dataTable.records.nonEmpty)
//    })
//
//  }
//
//  test("test parse date range conditions") {
//    val conditions = Seq(
//      LastNMinute(TableField(dbName, tblName, "Order_Date", "Date"), 1),
//      LastNHour(TableField(dbName, tblName, "Order_Date", "Date"), 1),
//      LastNDay(TableField(dbName, tblName, "Order_Date", "Date"), 1),
//      LastNWeek(TableField(dbName, tblName, "Order_Date", "Date"), 1),
//      LastNMonth(TableField(dbName, tblName, "Order_Date", "Date"), 1),
//      LastNQuarter(TableField(dbName, tblName, "Order_Date", "Date"), 1),
//      LastNYear(TableField(dbName, tblName, "Order_Date", "Date"), 1),
//      CurrentDay(TableField(dbName, tblName, "Order_Date", "Date")),
//      CurrentWeek(TableField(dbName, tblName, "Order_Date", "Date")),
//      CurrentMonth(TableField(dbName, tblName, "Order_Date", "Date")),
//      CurrentQuarter(TableField(dbName, tblName, "Order_Date", "Date")),
//      CurrentYear(TableField(dbName, tblName, "Order_Date", "Date"))
//    )
//
//    conditions.foreach(condition => {
//      val selectWithCondition = ObjectQuery(
//        functions = Seq(Select(field = TableField(dbName, tblName, "Order_Date", "Date"))),
//        conditions = Seq(condition),
//        limit = Some(Limit(0, 10))
//      )
//
//      val sql = parser.parse(selectWithCondition)
//
//      val dataTable: DataTable = engine.execute(sql).syncGet()
//      assert(dataTable.headers.nonEmpty)
//    })
//  }
//
//}

//
///**
//  * created 2023-06-27 2:29 PM
//  *
//  * @author tvc12 - Thien Vi
//  */
//class RedshiftDDLExecutorTest extends Test {
//  val injector = TestInjector(TestContainerModule).create
//  val source: RedshiftConnection = injector.instance[RedshiftConnection]
//  val engineCreator = new RedshiftEngineFactory()
//  val engine = engineCreator.create(source)
//  val dbName = "test"
//  var tableName = "default_table"
//  var viewTblName = "view_table"
//  var materializedViewTblName = "materialized_view_table"
//  val client = engine.client
//  val ddlExecutor = engine.getDDLExecutor()
//  private val orgId = 1
//  private val defaultTableSchema = createTable(dbName, tableName)
//  private val viewTableSchema = createTable(dbName, viewTblName).copy(
//    tableType = Some(TableType.View),
//    query = Some(s"select id from ${dbName}.${tableName}"),
//    columns = Seq(StringColumn("id", "id", isNullable = true))
//  )
//  private val materializedTableSchema = createTable(dbName, materializedViewTblName).copy(
//    tableType = Some(TableType.Materialized),
//    query = Some(s"select id from ${dbName}.${tableName}")
//  )
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    cleanup()
//  }
//
//  override def afterAll(): Unit = {
//    super.afterAll()
//    cleanup()
//  }
//
//  private def cleanup(): Unit = {
//    try {
//      client.executeUpdate(s"drop schema ${dbName}")
//    } catch {
//      case _: Throwable => //ignore
//    }
//  }
//
//  test("Test create databases success") {
//    val isSuccess: Boolean = await(ddlExecutor.createDatabase(dbName))
//    assert(isSuccess)
//  }
//
//  test("Test check database existed") {
//    val isExisted: Boolean = await(ddlExecutor.existsDatabaseSchema(dbName))
//    assert(isExisted)
//  }
//
//  test("Test create table success") {
//    val isSuccess: Boolean = await(ddlExecutor.createTable(defaultTableSchema))
//    assert(isSuccess)
//  }
//
//  test("Test create view success") {
//    val isSuccess: Boolean = await(ddlExecutor.createTable(viewTableSchema))
//    assert(isSuccess)
//  }
//
//  test("Test create table already exists") {
//    assertFailedFuture[Throwable](ddlExecutor.createTable(viewTableSchema))
//  }
//
//  test("Test create materialized view") {
//    assertFailedFuture[UnsupportedError](ddlExecutor.createTable(materializedTableSchema))
//  }
//
//  test("Test check table existed") {
//    val isExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, tableName))
//    assert(isExisted)
//  }
//
//  test("Test check table not existed") {
//    val isExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, "fake_table"))
//    assert(!isExisted)
//  }
//
//  test("Test list database names") {
//    val databases: Seq[String] = await(ddlExecutor.getDbNames())
//    assert(databases.nonEmpty)
//    assert(databases.contains(dbName))
//  }
//
//  test("Test list table names") {
//    val tables: Seq[String] = await(ddlExecutor.getTableNames(dbName))
//    assert(tables.nonEmpty)
//    assert(tables.contains(tableName))
//    assert(tables.contains(viewTblName))
//    assert(!tables.contains(materializedViewTblName))
//  }
//
//  test("Test list table not exists") {
//    assertFailedFuture[Throwable](ddlExecutor.getTableNames("not_exists"))
//  }
//
//  test("Test list column names") {
//    val columnNames: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
//    assertColumnNames(columnNames)
//  }
//
//  test("Test list column names not exists") {
//    assertFailedFuture[Throwable](ddlExecutor.getColumnNames(dbName, "not_exists"))
//  }
//
//  test("Test scan tables") {
//    val tables: Seq[TableSchema] = await(ddlExecutor.scanTables(orgId, dbName))
//    assert(tables.nonEmpty)
//    assert(tables.size == 2)
//    assert(tables.exists(_.name == tableName))
//    assert(tables.exists(_.name == viewTblName))
//    assert(!tables.exists(_.name == materializedViewTblName))
//    val defaultTable: TableSchema = tables.find(_.name == tableName).get
//    val viewTable: TableSchema = tables.find(_.name == viewTblName).get
//    assertTable(defaultTable, defaultTableSchema)
//    assertTable(viewTable, viewTableSchema)
//  }
//
//  test("Test rename view") {
//    val oldTableName = viewTblName
//    viewTblName = "new_view_table"
//    val isSuccess: Boolean = await(ddlExecutor.renameTable(dbName, oldTableName, viewTblName))
//    assert(isSuccess)
//    testExistTable(dbName, oldTableName, false)
//    testExistTable(dbName, viewTblName, true)
//  }
//
//  test("Test rename table") {
//    val oldTableName = tableName
//    tableName = "new_default_table"
//    val isSuccess: Boolean = await(ddlExecutor.renameTable(dbName, oldTableName, tableName))
//    assert(isSuccess)
//    testExistTable(dbName, oldTableName, false)
//    testExistTable(dbName, tableName, true)
//  }
//
//  test("Test rename table not exists") {
//    val newTableName = "not_exists_table"
//    assertFailedFuture[Throwable](ddlExecutor.renameTable(dbName, "not_exists", newTableName))
//  }
//
//  test("Test add column success") {
//    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
//    val isSuccess: Boolean = await(ddlExecutor.addColumn(dbName, tableName, newColumn))
//    assert(isSuccess)
//    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
//    assert(columns.contains(newColumn.name))
//  }
//
//  test("Test add column already exists") {
//    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
//    assertFailedFuture[InternalError](ddlExecutor.addColumn(dbName, tableName, newColumn))
//  }
//
//  test("Test add column to view") {
//    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
//    assertFailedFuture[InternalError](ddlExecutor.addColumn(dbName, viewTblName, newColumn))
//  }
//
//  test("Test add column to table not exists") {
//    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
//    assertFailedFuture[InternalError](ddlExecutor.addColumn(dbName, "not_exists", newColumn))
//  }
//
//  test("Test add columns") {
//    val newColumns = Seq(
//      Int64Column("new_column1", "new_column1", isNullable = true),
//      Int64Column("new_column2", "new_column2", defaultValue = Some(1), isNullable = true),
//      FloatColumn("new_column3", "new_column3", defaultValue = Some(1.2f), isNullable = true),
//      DateTimeColumn("new_column4", "new_column4", defaultValue = Some(System.currentTimeMillis()), isNullable = true),
//      DateColumn("new_column5", "new_column5", defaultValue = Some(System.currentTimeMillis()), isNullable = true)
//    )
//    val isSuccess: Boolean = await(ddlExecutor.addColumns(dbName, tableName, newColumns))
//    assert(isSuccess)
//    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
//    assert(columns.contains(newColumns.head.name))
//  }
//
//  test("Test update column int to string") {
//    val newColumn = StringColumn("age", "age", isNullable = true)
//    val success = await(ddlExecutor.updateColumn(dbName, tableName, newColumn))
//    assert(success)
//    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
//    assert(columns.contains(newColumn.name))
//  }
//
//  test("Test update column float to int") {
//    val newColumn = Int64Column("salary", "salary", isNullable = false)
//    val isSuccess: Boolean = await(ddlExecutor.updateColumn(dbName, tableName, newColumn))
//    assert(isSuccess)
//    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
//    assert(columns.contains(newColumn.name))
//  }
//
//  test("Test update column required to nullable") {
//    val newColumn = Int64Column("salary", "salary", isNullable = true)
//    val isSuccess: Boolean = await(ddlExecutor.updateColumn(dbName, tableName, newColumn))
//    assert(isSuccess)
//    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
//    assert(columns.contains(newColumn.name))
//  }
//
//  test("Test update column not exists") {
//    val newColumn = StringColumn("not_exists", "not_exists", isNullable = true)
//    assertFailedFuture[Throwable](ddlExecutor.updateColumn(dbName, tableName, newColumn))
//  }
//
//  test("Test drop column im table") {
//    val isSuccess: Boolean = await(ddlExecutor.dropColumn(dbName, tableName, "new_column"))
//    assert(isSuccess)
//    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
//    assert(!columns.contains("new_column"))
//  }
//
//  test("Test drop column in view") {
//    assertFailedFuture[InternalError](ddlExecutor.dropColumn(dbName, viewTblName, "new_column"))
//  }
//
//  test("Test drop column in materialized view") {
//    assertFailedFuture[InternalError](ddlExecutor.dropColumn(dbName, materializedViewTblName, "new_column"))
//  }
//
//  test("Test drop column not exists") {
//    assertFailedFuture[InternalError](ddlExecutor.dropColumn(dbName, tableName, "not_exists"))
//  }
//
//  test("Test drop view") {
//    val isSuccess: Boolean = await(ddlExecutor.dropTable(dbName, viewTblName, TableType.View))
//    assert(isSuccess)
//    val isTableExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, viewTblName))
//    assert(!isTableExisted)
//  }
//
//  test("Test drop table") {
//    val isSuccess: Boolean = await(ddlExecutor.dropTable(dbName, tableName))
//    assert(isSuccess)
//    val isTableExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, tableName))
//    assert(!isTableExisted)
//  }
//
//  test("Test drop database") {
//    val isSuccess: Boolean = await(ddlExecutor.dropDatabase(dbName))
//    assert(isSuccess)
//    val isDbExisted: Boolean = await(ddlExecutor.existsDatabaseSchema(dbName))
//    assert(!isDbExisted)
//  }
//
////  test("[Detect columns] SELECT 1") {
////    val columns: Seq[Column] = await(ddlExecutor.detectColumns("select 1 as id"))
////    assertResult(expected = true)(columns.nonEmpty)
////    assertResult(expected = 1)(columns.length)
////    val column: Column = columns.head;
////    assert(column.getClass == classOf[Int32Column])
////    assertResult(expected = "id")(column.displayName)
////    assertResult(expected = "id")(column.name)
////    assertResult(expected = false)(column.isNullable)
////  }
//
////  test("[Detect columns] text, number and date time") {
////    val query =
////      "select 'text' as text, 1 as number, CAST('99999999999999999999999999' as SIGNED) as long_number, CAST('2020-01-01 00:00:00' as DATETIME) as datetime"
////    val columns: Seq[Column] = await(ddlExecutor.detectColumns(query))
////    assertResult(expected = true)(columns.nonEmpty)
////    assertResult(expected = 4)(columns.length)
////    val textColumn: Column = columns.head;
////    assert(textColumn.getClass == classOf[StringColumn])
////    assertResult(expected = "text")(textColumn.displayName)
////    assertResult(expected = "text")(textColumn.name)
////    assertResult(expected = false)(textColumn.isNullable)
////    val numberColumn: Column = columns(1);
////    assert(numberColumn.getClass == classOf[Int32Column])
////    assertResult(expected = "number")(numberColumn.displayName)
////    assertResult(expected = "number")(numberColumn.name)
////    assertResult(expected = false)(numberColumn.isNullable)
////    val longNumberColumn: Column = columns(2);
////    assert(longNumberColumn.getClass == classOf[Int64Column])
////    assertResult(expected = "long_number")(longNumberColumn.displayName)
////    assertResult(expected = "long_number")(longNumberColumn.name)
////    assertResult(expected = false)(longNumberColumn.isNullable)
////    val datetimeColumn: Column = columns(3);
////    assert(datetimeColumn.getClass == classOf[DateTimeColumn])
////    assertResult(expected = "datetime")(datetimeColumn.displayName)
////    assertResult(expected = "datetime")(datetimeColumn.name)
////    assertResult(expected = true)(datetimeColumn.isNullable)
////  }
//
////  test("[Detect columns] detect double, date") {
////    val query = "select 1.0 as 'double', CAST('2020-01-01' as DATE) as date"
////    val columns: Seq[Column] = await(ddlExecutor.detectColumns(query))
////    assertResult(expected = true)(columns.nonEmpty)
////    assertResult(expected = 2)(columns.length)
////    val doubleColumn: Column = columns.head;
////    assert(doubleColumn.getClass == classOf[DoubleColumn])
////    assertResult(expected = "double")(doubleColumn.displayName)
////    assertResult(expected = "double")(doubleColumn.name)
////    assertResult(expected = false)(doubleColumn.isNullable)
////    val dateColumn: Column = columns(1);
////    assert(dateColumn.getClass == classOf[DateColumn])
////    assertResult(expected = "date")(dateColumn.displayName)
////    assertResult(expected = "date")(dateColumn.name)
////    assertResult(expected = true)(dateColumn.isNullable)
////  }
////
////  test("[Detect columns] with wrongs syntax") {
////    assertFailedFuture[InternalError](ddlExecutor.detectColumns("select 1 as"))
////  }
//
//  private def assertTable(actualSchema: TableSchema, expectedSchema: TableSchema): Unit = {
//    println(
//      s"actual schema:: name: ${actualSchema.name}, columns_size: ${actualSchema.columns.size}, type: ${actualSchema.getTableType}"
//    )
//    assert(actualSchema.name == expectedSchema.name)
//    assert(actualSchema.dbName == expectedSchema.dbName)
//    assert(actualSchema.columns.size == expectedSchema.columns.size)
//    assert(actualSchema.tableType == expectedSchema.tableType)
//    assert(actualSchema.query.isDefined == expectedSchema.query.isDefined)
//    actualSchema.columns.foreach(actualColumn => {
//      assert(expectedSchema.columns.exists(_.name == actualColumn.name))
//      val expectedColumn: Column = expectedSchema.columns.find(_.name == actualColumn.name).get
//      assertColumn(actualSchema.getTableType, actualColumn, expectedColumn)
//    })
//  }
//
//  private def assertColumn(tableType: TableType, actualColumn: Column, expectedColumn: Column): Unit = {
//    expectedColumn match {
//      case _: NestedColumn => assert(actualColumn.isInstanceOf[StringColumn])
//      case _: ArrayColumn  => assert(actualColumn.isInstanceOf[StringColumn])
//      case _: BoolColumn   => assert(actualColumn.isInstanceOf[BoolColumn])
//      case _               => assert(actualColumn.getClass == expectedColumn.getClass)
//    }
//    assert(actualColumn.name == expectedColumn.name)
//    assert(actualColumn.description == expectedColumn.description)
//    assert(actualColumn.displayName == expectedColumn.displayName)
//    assert(actualColumn.isNullable == expectedColumn.isNullable)
//  }
//
//  private def assertColumnNames(columnNames: Set[String]): Unit = {
//    assert(columnNames.nonEmpty)
//    assert(columnNames.size == 17)
//    assert(columnNames.contains("id"))
//    assert(columnNames.contains("age"))
//    assert(columnNames.contains("height"))
//    assert(columnNames.contains("weight"))
//    assert(columnNames.contains("salary"))
//    assert(columnNames.contains("total_money"))
//    assert(columnNames.contains("is_active"))
//    assert(columnNames.contains("unit_car"))
//    assert(columnNames.contains("unit_cat"))
//    assert(columnNames.contains("unit_dog"))
//    assert(columnNames.contains("unit_bee"))
//    assert(columnNames.contains("unit_tiger"))
//    assert(columnNames.contains("birth_day"))
//    assert(columnNames.contains("marriage_time"))
//    assert(columnNames.contains("address"))
//    assert(columnNames.contains("hobbies"))
//  }
//
//  private def createTable(dbName: String, name: String): TableSchema = {
//    val columns: Seq[Column] = Seq(
//      StringColumn("id", "id", isNullable = false),
//      Int32Column("age", "age", defaultValue = Some(12), isNullable = true),
//      Int32Column("height", "height", isNullable = true),
//      Int32Column("weight", "weight", isNullable = true),
//      Int64Column("salary", "salary", isNullable = false),
//      DoubleColumn("annual_salary", "annual_salary", isNullable = true),
//      DoubleColumn("total_money", "total_money", isNullable = true),
//      BoolColumn("is_active", "is_active", isNullable = true),
//      Int32Column("unit_car", "unit_car", isNullable = true),
//      Int32Column("unit_cat", "unit_cat", isNullable = true),
//      Int32Column("unit_dog", "unit_dog", isNullable = true),
//      Int32Column("unit_bee", "unit_bee", isNullable = true),
//      Int64Column("unit_tiger", "unit_tiger", isNullable = true),
//      DateColumn("birth_day", "birth_day", isNullable = true),
//      DateTimeColumn("marriage_time", "marriage_time", isNullable = true),
//      NestedColumn(
//        "address",
//        "address",
//        nestedColumns = Seq(
//          StringColumn("street", "street"),
//          StringColumn("city", "city"),
//          StringColumn("country", "country")
//        ),
//        isNullable = true
//      ),
//      ArrayColumn("hobbies", "hobbies", column = StringColumn("hobby", "hobby"), isNullable = true)
//    )
//    TableSchema(
//      organizationId = 1,
//      dbName = dbName,
//      name = name,
//      tableType = Some(TableType.Default),
//      columns = columns,
//      displayName = name
//    )
//  }
//
//  private def testExistTable(dbName: String, name: String, expected: Boolean): Unit = {
//    try {
//      val query = s"select 1 from ${dbName}.${name} limit 1"
//      client.executeQuery(query)(rs => rs.next())
//      assert(expected == true)
//    } catch {
//      case e: TestFailedException => throw e
//      case e: Exception => {
//        e.printStackTrace()
//        assert(expected == false)
//      }
//    }
//  }
//
//}
