package co.datainsider.query

import co.datainsider.bi.domain.RlsCondition
import co.datainsider.bi.domain.chart.{NumberChartSetting, TableColumn}
import co.datainsider.bi.domain.query.{JoinCondition, TableField, _}
import co.datainsider.bi.domain.response.SqlQueryResponse
import co.datainsider.bi.engine.clickhouse.{ClickhouseParser, DataTable}
import co.datainsider.bi.util.ZConfig
import org.scalatest.{BeforeAndAfterAll, FunSuite}

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.io.Source

class ObjectQueryParserTest extends FunSuite with BeforeAndAfterAll {
  val parser: QueryParserImpl = new QueryParserImpl(ClickhouseParser)
  val db: String = ZConfig.getString("fake_data.database.name")
  val tblCustomers: String = ZConfig.getString("fake_data.table.customers.name")
  val tblOrders: String = ZConfig.getString("fake_data.table.orders.name")
  val tblProducts: String = ZConfig.getString("fake_data.table.products.name")

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb()
    DbTestUtils.insertFakeData()
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb()
  }

  test("test select function") {
    val selectId = Select(TableField(db, tblCustomers, "id", "Int32"))
    val selectName = Select(TableField(db, tblCustomers, "name", "String"))
    val selectAddress = Select(TableField(db, tblCustomers, "address", "String"))
    val selectDob = Select(TableField(db, tblCustomers, "dob", "Date"))
    val objQuery = ObjectQuery(
      Array[Function](selectId, selectName, selectAddress, selectDob),
      Array[Condition]()
    )
    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)

    val results = DbTestUtils.execute(query)
    assert(results != null)

  }

  test("test group by") {
    val groupByAddress = GroupBy(TableField(db, tblCustomers, "address", "String"))
    val objQuery = ObjectQuery(
      Array[Function](groupByAddress),
      Array[Condition]()
    )
    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)
    val results = DbTestUtils.execute(query)
    assert(results != null)

  }

  // no longer work due to table relationship management
  /*test("select from multiple table") {
  val selectCustomerName = Select(TableField(db, tblCustomers, "name", "String"))
  val selectProductName = Select(TableField(db, tblProducts, "name", "String"))
  val equalCustomerId = EqualTableField(
    TableField(db, tblOrders, "customer_id", "UInt32"),
    TableField(db, tblCustomers, "id", "UInt32")
  )
  val equalProductId = EqualTableField(
    TableField(db, tblOrders, "product_id", "UInt32"),
    TableField(db, "Products", "id", "UInt32")
  )
  val objQuery = ObjectQuery(
    Array[Function](selectCustomerName, selectProductName),
    Array[Condition](And(Array(equalCustomerId, equalProductId)))
  )
 val query = Await.result(parser.parse(objQuery, Array.empty))
  assert(query != null)
  println(query)
  val results = DbTestUtils.execute(query)
  assert(results != null)
  println(results)
  val orderCnt = getNumOrders
  assert(results.size - 1 == orderCnt)
}*/

  test("test add filters to sql query without where clause") {
    val sql = SqlQuery(s"select * from $db.$tblCustomers")
    val between = Between(TableField(db, tblCustomers, "dob", "String"), "2000-01-01 00:00:00", "2020-12-31 00:00:00")
    val like = Like(TableField(db, tblCustomers, "name", "String"), "Ronaldo")
    val filters = Array[Condition](And(Array(between, like)))

    val query = parser.parse(sql)
    val results = DbTestUtils.execute(query)
  }

  test("test add filters to sql query with where clause") {
    val sql = SqlQuery(s"select * from $db.$tblCustomers where name like 'Ronaldo'")
    val between = Between(TableField(db, tblCustomers, "dob", "String"), "2000-01-01 00:00:00", "2020-12-31 00:00:00")
    val filters = Array[Condition](between)

    val query = parser.parse(sql)
    val results = DbTestUtils.execute(query)
  }

  test("test add filters to object query") {
    val selectName = Select(TableField(db, tblCustomers, "name", "String"))
    val objQuery = ObjectQuery(
      Array[Function](selectName),
      Array[Condition]()
    )
    val between = Between(TableField(db, tblCustomers, "dob", "String"), "2000-01-01 00:00:00", "2020-12-31 00:00:00")
    val like = Like(TableField(db, tblCustomers, "name", "String"), "Ronaldo")
    val filters = Array[Condition](And(Array(between, like)))

    val query = parser.parse(objQuery)
    println(s"\n\n\n\n\n\n\n$query\n\n\n\n\n\n\n")
    assert(query != null)

    val results = DbTestUtils.execute(query)
    assert(results != null)

    val queryResp: SqlQueryResponse = DbTestUtils.execute(query)
    assert(queryResp.records.length == 4)
  }

  test("query with condition and filter") {
    val selectName = Select(TableField(db, tblCustomers, "name", "String"))
    val like = Like(TableField(db, tblCustomers, "name", "String"), "Ronaldo")
    val objQuery = ObjectQuery(
      Array[Function](selectName),
      Array[Condition](like)
    )
    val between = Between(TableField(db, tblCustomers, "dob", "String"), "2000-01-01 00:00:00", "2020-12-31 00:00:00")
    val filters = Array[Condition](between)

    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)
    val results = DbTestUtils.execute(query)
    assert(results != null)
    println(results)

    val queryResp: SqlQueryResponse = DbTestUtils.execute(query)
    assert(queryResp.records.length == 2)
  }

  test("query with scalar function") {
    val toYear = ToYearNum()
    val group = GroupBy(TableField(db, tblCustomers, "dob", "Date"), Some(toYear))
    val sum = Sum(TableField(db, tblCustomers, "id", "Int32"))
    val objQuery = ObjectQuery(
      Seq(group, sum),
      Seq.empty
    )
    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)

    val results = DbTestUtils.execute(query)
    assert(results != null)
    println(results)
  }

  test("object query preview chart with isLimit = true") {
    val selectId = Select(TableField(db, tblCustomers, "id", "Int32"))
    val selectName = Select(TableField(db, tblCustomers, "name", "String"))
    val selectAddress = Select(TableField(db, tblCustomers, "address", "String"))
    val selectDob = Select(TableField(db, tblCustomers, "dob", "Date"))
    val objQuery = ObjectQuery(
      Array[Function](selectId, selectName, selectAddress, selectDob),
      Array[Condition]()
    )
    val query = parser.parse(objQuery)
    val limitedSql = ClickhouseParser.addLimit(query, Limit(0, 100))

    assert(limitedSql != null)
    println(limitedSql)

    val results = DbTestUtils.execute(limitedSql)
    assert(results != null)
    println(results)
  }

  test("object query group by date and scalar functions") {
    val toYear = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToYear()))
    val toQuarter = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToQuarter()))
    val toMonth = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToMonth()))
    val toDayOfYear = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToDayOfYear()))
    val toDayOfMonth = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToDayOfMonth()))
    val toDayOfWeek = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToDayOfWeek()))
    val toHour = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToHour()))
    val toMinute = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToMinute()))
    val toSecond = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToSecond()))
    val toYearNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToYearNum()))
    val toQuarterNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToQuarterNum()))
    val toMonthNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToMonthNum()))
    val toWeekNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToWeekNum()))
    val toDayNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToDayNum()))
    val toHourNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToHourNum()))
    val toMinuteNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToMinuteNum()))
    val toSecondNum = GroupBy(TableField(db, tblCustomers, "dob", "datetime"), Some(ToSecondNum()))

    val objQuery = ObjectQuery(
      Array[Function](
        toYear,
        toQuarter,
        toMonth,
        toDayOfYear,
        toDayOfMonth,
        toDayOfWeek,
        toHour,
        toMinute,
        toSecond,
        toYearNum,
        toQuarterNum,
        toMonthNum,
        toWeekNum,
        toDayNum,
        toHourNum,
        toMinuteNum,
        toSecondNum
      ),
      Array[Condition]()
    )
    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)

    val results = DbTestUtils.execute(query)
    assert(results != null)
    println(results)
  }

  test("object query aggregate functions") {
    val groupBySeller = GroupBy(TableField(db, tblProducts, "seller", "string"))
    val count = Count(TableField(db, tblProducts, "id", "UInt32"))
    val countDistinct = CountDistinct(TableField(db, tblProducts, "id", "UInt32"))
    val min = Min(TableField(db, tblProducts, "price", "UInt32"))
    val max = Max(TableField(db, tblProducts, "price", "UInt32"))
    val avg = Avg(TableField(db, tblProducts, "price", "UInt32"))

    val objQuery = ObjectQuery(
      Array[Function](groupBySeller, count, countDistinct, min, avg, max),
      Array[Condition]()
    )
    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)

    val results = DbTestUtils.execute(query)
    assert(results != null)
    println(results)
  }

  test("object query select distinct test") {
    val selectDistinctName = SelectDistinct(TableField(db, tblProducts, "name", "string"))
    val objQuery = ObjectQuery(
      Array[Function](selectDistinctName),
      Array[Condition]()
    )
    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)

    val results = DbTestUtils.execute(query)
    assert(results != null)
    val queryResp: SqlQueryResponse = DbTestUtils.execute(query)
    assert(queryResp.records.length == 4)
    println(results)
  }

  test("test select wildcard") {
    val objQuery = ObjectQuery(
      functions = Seq(CountAll(None)),
      queryViews = Seq(SqlView("sql_view", SqlQuery("select 1")))
    )
    val query = parser.parse(objQuery)
    assert(query != null)
    println(query)

    val results = DbTestUtils.execute(query)
    assert(results != null)
  }

  test("test parse decrypt scalar function") {
    val mode = "aes-256-gcm"
    val key = "2f17958458160187530dcdbdc0ce892fb67a18100733ec35b0f713a5790b765d"
    val iv = "d4fcb696b6e8e06b4a3cdc630e8176b7"

    val selectDecrypt =
      Select(
        TableField(db, tblCustomers, "seller", "string"),
        scalarFunction = Some(Decrypt())
      )

    val objQuery = ObjectQuery(
      functions = Seq(selectDecrypt),
      encryptKey = Some("2f17958458160187530dcdbdc0ce892fb67a18100733ec35b0f713a5790b765d")
    )
    val query = parser.parse(objQuery)
    assert(query != null)

    assert(query.contains(mode))
    assert(query.contains(key))
    assert(query.contains(iv))
  }

  test("test parse object query with rls") {
    val condition = RlsCondition(
      dbName = db,
      tblName = tblProducts,
      conditions = Seq(Equal(TableField(db, tblProducts, "name", "String"), "Iphone"))
    )

    val objQuery = ObjectQuery(
      functions = Seq(Select(TableField(db, tblProducts, "name", "string"))),
      rlsConditions = Seq(condition)
    )

    val sql = parser.parse(objQuery)
    assert(sql != null)

    println(sql)

    val results = DbTestUtils.execute(sql)
    assert(results.records.length == 4)

  }

  test("test parse sql query with rls") {
    val condition = RlsCondition(
      dbName = db,
      tblName = tblProducts,
      conditions = Seq(Equal(TableField(db, tblProducts, "name", "String"), "Iphone"))
    )

    val sqlQuery = SqlQuery(
      query = s"select * from (select * from (select * from $db.$tblProducts))",
      rlsConditions = Seq(condition)
    )

    val sql = parser.parse(sqlQuery)
    assert(sql != null)

    println(sql)

    val results = DbTestUtils.execute(sql)
    assert(results.records.length == 4)

  }

  test("test get all views dashboard") {
    val numberChartSetting = NumberChartSetting(
      value = TableColumn("sum costs", Sum(TableField("db_name", "orders", "costs", "double"))),
      filters = Array(Equal(TableField("db_name", "orders", "costs", "double"), "user_a")),
      sqlViews = Array(SqlView("sql_view", SqlQuery("select distinct product_name from db_name.products")))
    )

    val query = numberChartSetting.toQuery
    val allViews = query.asInstanceOf[ObjectQuery].allQueryViews

    assert(allViews.length == 2)
    println(allViews.mkString(", "))
    println(
      parser.parse(
        query
          .asInstanceOf[ObjectQuery]
          .copy(joinConditions =
            Seq(
              InnerJoin(
                allViews(0),
                allViews(1),
                Seq(
                  EqualField(
                    TableField("db_name", "tbl_name", "a", "string"),
                    TableField("db_name", "tbl_name", "b", "string")
                  )
                )
              )
            )
          )
      )
    )
  }

  private def getIndexByColName(colNames: ArrayBuffer[Object]): mutable.Map[String, Int] = {
    val mapIndex = mutable.Map[String, Int]()
    for (i <- colNames.indices)
      mapIndex(colNames(i).toString) = i
    mapIndex
  }

  private def getCustomersFromCsv: mutable.Map[(String, String), String] = {
    val customersCsv = Source.fromFile("test-data/customers.csv")
    val mapCustomers: mutable.Map[(String, String), String] = mutable.Map()
    for (line <- customersCsv.getLines) {
      val Array(id, name, address, dob) = line.split(",").map(_.trim)
      mapCustomers((id, "name")) = name
      mapCustomers((id, "address")) = address
      mapCustomers((id, "dob")) = dob
    }
    customersCsv.close()
    mapCustomers
  }

  private def getNumOrders: Int = {
    val ordersCsv = Source.fromFile("test-data/orders.csv")
    val cnt = ordersCsv.getLines().size
    ordersCsv.close()
    cnt
  }

}
