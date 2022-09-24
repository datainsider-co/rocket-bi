package co.datainsider.bi.engine

import co.datainsider.bi.domain.QueryContext
import co.datainsider.bi.domain.query.{
  AlwaysFalse,
  AlwaysTrue,
  And,
  CurrentQuarter,
  CurrentYear,
  DynamicCondition,
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
  SqlQuery,
  TableField
}
import co.datainsider.bi.domain.response.SqlQueryResponse
import co.datainsider.bi.engine.clickhouse.ClickhouseParser
import co.datainsider.query.DbTestUtils
import org.scalatest.{BeforeAndAfterAll, FunSuite}

import scala.collection.mutable

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

  test("test parse sql with query context") {
    val queryContext = QueryContext(
      variables = Map(
        "total_cost_usd" -> "sum(Total_Cost)/23000",
        "total_cost_usd_x1000" -> "total_cost_usd*1000"
      )
    )
    val sqlQuery = SqlQuery(
      query = s"select total_cost_usd_x1000 from ${DbTestUtils.dbName}.${DbTestUtils.tblSales} group by Region",
      externalContext = Some(queryContext)
    )
    val finalSql = parser.parse(sqlQuery)
    println(finalSql)
    assert(finalSql.contains("sum"))

    val queryResp: SqlQueryResponse = DbTestUtils.execute(finalSql)
    assert(queryResp.records.nonEmpty)
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
}
