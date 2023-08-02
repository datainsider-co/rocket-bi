package co.datainsider.bi.engine.clickhouse

import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.domain.query._
import co.datainsider.bi.domain.response.SqlQueryResponse
import co.datainsider.bi.engine.clickhouse.ClickhouseParser
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.utils.DbTestUtils
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class QueryParserTest extends IntegrationTest with BeforeAndAfterAll {
  override def injector: Injector = TestInjector(TestContainerModule).newInstance()
  val parser = new QueryParserImpl(ClickhouseParser)
  val source: ClickhouseConnection = injector.instance[ClickhouseConnection]
  val client: JdbcClient = injector.instance[JdbcClient](Names.named("clickhouse"))

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb(client)
    DbTestUtils.insertFakeData(client)
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb(client)
  }

  private val orderDateField = TableField(DbTestUtils.dbName, DbTestUtils.tblSales, "Order_Date", "DateTime")
  private val selectRegionField = TableField(DbTestUtils.dbName, DbTestUtils.tblSales, "Region", "String")

  test("test CurrentQuarter PastNYear") {
    val dateCondition = CurrentQuarter(orderDateField, None, Some(PastNYear(5)))

    val query = ObjectQuery(
      functions = Seq(Select(orderDateField)),
      conditions = Seq(dateCondition)
    )

    val sql: String = parser.parse(query)
    assert(sql.contains("toIntervalYear"))
    assert(sql.contains("toStartOfQuarter"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.nonEmpty)
  }

  test("test CurrentYear PastNMonth") {
    val dateCondition = CurrentYear(orderDateField, None, Some(PastNMonth(5)))

    val query = ObjectQuery(
      functions = Seq(Select(orderDateField)),
      conditions = Seq(dateCondition)
    )

    val sql: String = parser.parse(query)
    assert(sql.contains("toIntervalMonth"))
    assert(sql.contains("toStartOfYear"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.headers.nonEmpty)
  }

  test("test LastNMonth PastNQuarter") {
    val dateCondition = LastNMonth(orderDateField, 12, None, Some(PastNQuarter(20)))

    val query = ObjectQuery(
      functions = Seq(Select(orderDateField)),
      conditions = Seq(dateCondition)
    )

    val sql: String = parser.parse(query)
    assert(sql.contains("toIntervalMonth"))
    assert(sql.contains("toIntervalQuarter"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.headers.nonEmpty)
  }

  test("test LastNQuarter PastNWeek") {
    val dateCondition = LastNQuarter(orderDateField, 20, None, Some(PastNWeek(5)))

    val query = ObjectQuery(
      functions = Seq(Select(orderDateField)),
      conditions = Seq(dateCondition)
    )

    val sql: String = parser.parse(query)
    assert(sql.contains("toIntervalQuarter"))
    assert(sql.contains("toIntervalWeek"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.headers.nonEmpty)
  }

  test("test LastNWeek PastNDay") {
    val dateCondition = LastNWeek(orderDateField, 250, None, Some(PastNDay(5)))

    val query = ObjectQuery(
      functions = Seq(Select(orderDateField)),
      conditions = Seq(dateCondition)
    )

    val sql: String = parser.parse(query)
    println(sql)
    assert(sql.contains("toIntervalWeek"))
    assert(sql.contains("toIntervalDay"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.headers.nonEmpty)
  }

  test("test parse query with empty dynamic condition") {
    val dynamicCondition = DynamicCondition(1L, And(Array.empty), Some(And(Array.empty)))

    val query = ObjectQuery(
      functions = Seq(Select(selectRegionField)),
      conditions = Seq(Or(Array(dynamicCondition)))
    )

    val sql: String = parser.parse(query)
    println(sql)

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.nonEmpty)
  }

  test("test parse query with always true condition") {
    val alwaysTrueCondition: AlwaysTrue = AlwaysTrue()

    val query = ObjectQuery(
      functions = Seq(Select(selectRegionField)),
      conditions = Seq(Or(Array(alwaysTrueCondition)))
    )

    val sql: String = parser.parse(query)
    println(sql)

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.nonEmpty)
  }

  test("test parse query with always false condition") {
    val alwaysFalseCondition = AlwaysFalse()

    val query = ObjectQuery(
      functions = Seq(Select(selectRegionField)),
      conditions = Seq(Or(Array(alwaysFalseCondition)))
    )

    val sql: String = parser.parse(query)
    println(sql)

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.isEmpty)
  }

  test("test parse query with expressions") {
    val query = ObjectQuery(
      functions = Seq(
        SelectExpression(
          ExpressionField(
            expression = "count(*)",
            dbName = DbTestUtils.dbName,
            tblName = DbTestUtils.tblSales,
            fieldName = "Total_Order_ID",
            fieldType = "UInt64"
          )
        )
      ),
      customExpressions = Map("Total_Order_ID" -> "count(*)")
    )

    val sql: String = parser.parse(query)
    assert(sql.contains("count(*)"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.nonEmpty)
  }

  test("test parse query expressions with existing expressions") {
    val query = ObjectQuery(
      functions = Seq(
        SelectExpression(
          ExpressionField(
            expression = "a/b",
            dbName = DbTestUtils.dbName,
            tblName = DbTestUtils.tblSales,
            fieldName = "Revenue_Per_Order",
            fieldType = "UInt64"
          )
        )
      ),
      customExpressions = Map(
        "a" -> "sum(Total_Revenue)",
        "b" -> "count(Order_ID)"
      )
    )

    val sql: String = parser.parse(query)

    assert(sql.contains("count(Order_ID)"))
    assert(sql.contains("sum(Total_Revenue)"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.nonEmpty)
  }

//  NOTE: failed for bigquery
//  test("test parse query with APPLY_ALL expressions") {
//    val query = ObjectQuery(
//      functions = Seq(
//        SelectExpression(
//          ExpressionField(
//            expression = "#(count(*))",
//            dbName = DbTestUtils.dbName,
//            tblName = DbTestUtils.tblSales,
//            fieldName = "Total_Order_ID",
//            fieldType = "UInt64"
//          )
//        )
//      )
//    )
//
//    val sql: String = parser.parse(query)
//
//    assert(sql.contains("with"))
//    assert(sql.contains("select count(*)"))
//    assert(sql.contains("select Total_Order_ID"))
//
//    println(sql)
//
//    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
//    assert(queryResp.records.nonEmpty)
//  }

  test("test parse sql query with parameters") {
    val query = SqlQuery(
      query = s"""
        |select *
        |from ${DbTestUtils.dbName}.${DbTestUtils.tblSales}
        |where Region = {{region}}
        |  and Order_Date >= {{  begin_date}}
        |  and Order_Date <= {{end_date  }}
        |  and Unit_Sold < {{  unit_sold  }}
        |""".stripMargin,
      parameters = Map(
        "region" -> "'Asia'",
        "begin_date" -> "'2018-01-01'",
        "end_date" -> "'2018-12-31'",
        "unit_sold" -> "1000"
      )
    )

    val sql: String = parser.parse(query)
    assert(sql.contains("""Region = 'Asia'"""))
    assert(sql.contains("""Order_Date >= '2018-01-01'"""))
    assert(sql.contains("""Order_Date <= '2018-12-31'"""))
    assert(sql.contains("""Unit_Sold < 1000"""))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.nonEmpty)
  }

  test("test parse query with two joined views") {
    val query = ObjectQuery(
      functions = Seq(
        SelectAll()
      ),
      joinConditions = Seq(
        FullJoin(
          leftView = TableView(DbTestUtils.dbName, DbTestUtils.tblOrders),
          rightView = SqlView(
            aliasName = "customers",
            query = ObjectQuery(
              functions = Seq(SelectAll()),
              queryViews = Seq(TableView(DbTestUtils.dbName, DbTestUtils.tblCustomers))
            )
          ),
          equals = Seq(
            EqualField(
              leftField = TableField(DbTestUtils.dbName, DbTestUtils.tblOrders, "customer_id", "string"),
              rightField = ViewField("customers", "id", "string"),
              leftScalarFunction = None,
              rightScalarFunction = None
            )
          )
        )
      )
    )

    val sql: String = parser.parse(query)

    val queryResp: SqlQueryResponse = DbTestUtils.execute(client, sql)
    assert(queryResp.records.nonEmpty)
  }

}
