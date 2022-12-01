package co.datainsider.bi.engine

import co.datainsider.bi.domain.query.{
  AlwaysFalse,
  AlwaysTrue,
  And,
  CurrentQuarter,
  CurrentYear,
  DynamicCondition,
  ExpressionField,
  LastNMonth,
  LastNQuarter,
  LastNWeek,
  ObjectQuery,
  Or,
  PastNDay,
  PastNMonth,
  PastNQuarter,
  PastNWeek,
  PastNYear,
  QueryParserImpl,
  Select,
  SelectExpression,
  TableField
}
import co.datainsider.bi.domain.response.SqlQueryResponse
import co.datainsider.bi.engine.clickhouse.ClickhouseParser
import co.datainsider.query.DbTestUtils
import org.scalatest.{BeforeAndAfterAll, FunSuite}

class QueryParserTest extends FunSuite with BeforeAndAfterAll {
  val parser = new QueryParserImpl(ClickhouseParser)

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb()
    DbTestUtils.insertFakeData()
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb()
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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
      expressions = Map("Total_Order_ID" -> "count(*)")
    )

    val sql: String = parser.parse(query)
    assert(sql.contains("with ("))
    assert(sql.contains("count(*)"))
    assert(sql.contains("select Total_Order_ID"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
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
      expressions = Map(
        "a" -> "sum(Total_Revenue)",
        "b" -> "count(Order_ID)"
      )
    )

    val sql: String = parser.parse(query)

    assert(sql.contains("with ("))
    assert(sql.contains("a/b"))
    assert(sql.contains("count(Order_ID)"))
    assert(sql.contains("sum(Total_Revenue)"))
    assert(sql.contains("select Revenue_Per_Order"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
    assert(queryResp.records.nonEmpty)
  }

  test("test parse query with COMPUTE expressions") {
    val query = ObjectQuery(
      functions = Seq(
        SelectExpression(
          ExpressionField(
            expression = "COMPUTE(count(*))",
            dbName = DbTestUtils.dbName,
            tblName = DbTestUtils.tblSales,
            fieldName = "Total_Order_ID",
            fieldType = "UInt64"
          )
        )
      )
    )

    val sql: String = parser.parse(query)

    assert(sql.contains("with ("))
    assert(sql.contains("select count(*)"))
    assert(sql.contains("select Total_Order_ID"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(sql)
    assert(queryResp.records.nonEmpty)
  }

}
