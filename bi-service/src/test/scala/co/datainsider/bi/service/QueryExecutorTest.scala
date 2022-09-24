package co.datainsider.bi.service

import co.datainsider.bi.domain.chart.TableColumn
import co.datainsider.bi.domain.query.{
  Condition,
  CountAll,
  Equal,
  Function,
  GroupBy,
  ObjectQuery,
  Select,
  SqlQuery,
  TableField,
  ToMonthNum,
  ToQuarterNum,
  ToYear
}
import co.datainsider.bi.module.TestModule
import co.datainsider.query.DbTestUtils
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class QueryExecutorTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()

  val queryExecutor: QueryExecutor = injector.instance[QueryExecutor]

  val dbName: String = DbTestUtils.dbName
  val tblCustomers: String = DbTestUtils.tblCustomers
  val tblOrder: String = DbTestUtils.tblOrders

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb()
    DbTestUtils.insertFakeData()
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb()
  }

  test("test execute query as tabular table") {
    val tableColumns: Array[TableColumn] = Array(
      TableColumn("id", Select(TableField(dbName, tblCustomers, "id", "UInt32"))),
      TableColumn("name", Select(TableField(dbName, tblCustomers, "name", "String")))
    )
    val objQuery = ObjectQuery(
      functions = Seq(
        Select(TableField(dbName, tblCustomers, "id", "UInt32")),
        Select(TableField(dbName, tblCustomers, "name", "String"))
      )
    )
    val df = queryExecutor.executeQuery(objQuery, tableColumns)
    println(df.headers.mkString(", "))
    df.records.foreach(r => println(r.mkString(", ")))
  }

  test("test execute query as pivot table") {
    val tableColumns: Array[TableColumn] = Array(
//      TableColumn("id", GroupBy(TableField(dbName, tblCustomers, "id", "UInt32"))),
//      TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String"))),
      TableColumn(
        "dob",
        GroupBy(TableField(dbName, tblCustomers, "dob", "Date"), Some(ToYear()))
      ),
      TableColumn("address", GroupBy(TableField(dbName, tblCustomers, "address", "String")), isHorizontalView = true),
      TableColumn("name", CountAll(None))
    )
    val objQuery = ObjectQuery(
      functions = Seq(
//        GroupBy(TableField(dbName, tblCustomers, "id", "UInt32")),
//        GroupBy(TableField(dbName, tblCustomers, "name", "String")),
        GroupBy(TableField(dbName, tblCustomers, "dob", "Date"), Some(ToYear())),
        GroupBy(TableField(dbName, tblCustomers, "address", "String")),
        CountAll(None)
      )
    )
    val df = queryExecutor.executeQuery(objQuery, tableColumns)
    println(df.headers.mkString(", "))
    df.records.foreach(r => println(r.mkString(", ")))
  }

  test("test apply row filter request") {
    val sqlQuery = SqlQuery(s"select * from $dbName.$tblCustomers where 1 = 1")

    val df = queryExecutor.executeQuery(sqlQuery, Array.empty, true)
    println(df.headers.mkString(", "))
    df.records.foreach(r => println(r.mkString(", ")))
  }

  test("test query with conditions with de-formatted values") {
    val tableColumns: Array[TableColumn] = Array(
      TableColumn(
        "dob",
        GroupBy(TableField(dbName, tblCustomers, "dob", "Date"), Some(ToMonthNum()))
      ),
      TableColumn("name", CountAll(None))
    )
    val objQuery = ObjectQuery(
      functions = Seq(
        GroupBy(TableField(dbName, tblCustomers, "dob", "Date"), Some(ToMonthNum())),
        CountAll(None)
      ),
      conditions = Seq(
        Equal(TableField(dbName, tblCustomers, "dob", "Date"), "1990-Jun", Some(ToMonthNum()))
      )
    )

    val df = queryExecutor.executeQuery(objQuery, tableColumns)
    println(df.headers.mkString(", "))
    df.records.foreach(r => println(r.mkString(", ")))
  }

}
