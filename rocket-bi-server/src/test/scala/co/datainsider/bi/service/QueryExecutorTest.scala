package co.datainsider.bi.service

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.chart.TableColumn
import co.datainsider.bi.domain.query._
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.bi.utils.DbTestUtils
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.schema.module.MockSchemaClientModule
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class QueryExecutorTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()

  val queryExecutor: QueryExecutor = injector.instance[QueryExecutor]
  val jdbcClient: JdbcClient = injector.instance[JdbcClient](Names.named("clickhouse"))

  val orgId = 0L
  val dbName: String = DbTestUtils.dbName
  val tblCustomers: String = DbTestUtils.tblCustomers
  val tblOrder: String = DbTestUtils.tblOrders

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb(jdbcClient)
    DbTestUtils.insertFakeData(jdbcClient)
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb(jdbcClient)
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
    val df = queryExecutor.executeQuery(orgId, objQuery, tableColumns).syncGet()
    assert(df.headers.nonEmpty)
    assert(df.records.nonEmpty)
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
    val df = queryExecutor.executeQuery(orgId, objQuery, tableColumns).syncGet()
    assert(df.headers.nonEmpty)
    assert(df.records.nonEmpty)
  }

  test("test apply row filter request") {
    val sqlQuery = SqlQuery(s"select * from $dbName.$tblCustomers where 1 = 1")

    val df = queryExecutor.executeQuery(orgId, sqlQuery, Array.empty, true).syncGet()
    assert(df.headers.nonEmpty)
    assert(df.records.nonEmpty)
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

    val df = queryExecutor.executeQuery(orgId, objQuery, tableColumns).syncGet()
    assert(df.headers.nonEmpty)
    assert(df.records.nonEmpty)
  }

}
