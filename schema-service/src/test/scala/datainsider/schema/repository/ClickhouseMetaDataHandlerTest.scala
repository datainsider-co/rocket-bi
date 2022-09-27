package datainsider.schema.repository

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.{JdbcClient, JsonParser, ZConfig}
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.misc.ClickHouseDDLConverter
import datainsider.schema.module.{MockHadoopFileClientModule, TestModule}

/**
  * created 2022-07-18 2:02 PM
  *
  * @author tvc12 - Thien Vi
  */
class ClickhouseMetaDataHandlerTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockCaasClientModule, MockHadoopFileClientModule).newInstance()
  val client = injector.instance[JdbcClient]
  var executor: DDLExecutor = _
  val dbTest = "db_test"
  val ignoredEngines = Seq(
    "ReplicatedMergeTree",
    "ReplicatedSummingMergeTree",
    "ReplicatedReplacingMergeTree",
    "ReplicatedAggregatingMergeTree",
    "ReplicatedCollapsingMergeTree",
    "ReplicatedVersionedCollapsingMergeTree",
    "ReplicatedGraphiteMergeTree"
  )
  val testTable = TableSchema(
    "test_table",
    dbTest,
    1L,
    "test_table",
    Seq(
      Int32Column("id", "Id"),
      DateTimeColumn("created_date", "Created Date"),
      StringColumn("location", "Location", defaultValue = Some("HCM")),
      StringColumn("shop", "Shop"),
      StringColumn("sale", "Sale")
    ),
    primaryKeys = Seq("id"),
    orderBys = Seq("id")
  )

  val testViewTable = TableSchema(
    "test_table_1",
    dbTest,
    1L,
    "test_table",
    Seq(
      Int32Column("id", "Id"),
      DateTimeColumn("created_date", "Created Date"),
      StringColumn("location", "Location", defaultValue = Some("HCM")),
      StringColumn("shop", "Shop"),
      StringColumn("sale", "Sale")
    ),
    primaryKeys = Seq("id"),
    orderBys = Seq("id"),
    query = Some(s"select * from ${dbTest}.test_table"),
    tableType = Some(TableType.View)
  )

  override protected def beforeAll(): Unit = {
    super.beforeAll()
    val clusterName: String = ZConfig.getString("db.clickhouse.cluster_name")

    executor = DDLExecutorImpl(client, ClickHouseDDLConverter(), clusterName)

    val isExisted = await(executor.existsDatabaseSchema(dbTest))
    if (isExisted) {
      await(executor.dropDatabase(dbTest))
    }
    await(executor.createDatabase(dbTest, true))
  }

  protected override def afterAll(): Unit = {
    super.afterAll()
    val dropOK = await(executor.dropDatabase(dbTest))
    assert(dropOK)
  }

  test("Create table") {
    val isOK = await(executor.createTable(testTable))
    assert(isOK)
  }

  test("Create table view") {
    val isOK = await(executor.createTable(testViewTable))
    assert(isOK)
  }

  test("scan and get database from clickhouse") {
    val handler: ClickhouseMetaDataHandler = new ClickhouseMetaDataHandlerImpl(client)
    val databaseNames: Seq[String] = handler.getDatabaseNames()
    println(s"databases: ${databaseNames.mkString("\n")}")
    assert(databaseNames.contains("default"))
    assert(databaseNames.contains("system"))
  }

  test("scan and get table schema of database from clickhouse") {
    val handler: ClickhouseMetaDataHandler = new ClickhouseMetaDataHandlerImpl(client)
    val tables: Seq[TableSchema] = handler.getTables(
      1L,
      dbTest,
      ignoredEngines
    )
    assert(tables.nonEmpty)
    assert(tables.exists(table => table.name == testTable.name))
    // assert test table
    val result: TableSchema = tables.find(table => table.name == testTable.name).get
    println("result: " + JsonParser.toJson(result))
    assert(result.name == testTable.name)
    assert(result.dbName == testTable.dbName)
    assert(result.engine == testTable.engine)
    assert(result.tableType.getOrElse(TableType.Default) == testTable.tableType.getOrElse(TableType.Default))
    assert(result.columns.size == testTable.columns.size)
    // assert view table
    val viewTable: TableSchema = tables.find(table => table.name == testViewTable.name).get
    println("result: " + JsonParser.toJson(viewTable))
    assert(viewTable.name == testViewTable.name)
    assert(viewTable.dbName == testViewTable.dbName)
    assert(viewTable.engine == testViewTable.engine)
    assert(viewTable.tableType == testViewTable.tableType)
    assert(viewTable.query.map(_.toLowerCase.trim) == testViewTable.query.map(_.toLowerCase.trim))
    assert(viewTable.columns.size == testViewTable.columns.size)
  }

  test("get columns of schemas test_table from clickhouse") {
    val handler: ClickhouseMetaDataHandler = new ClickhouseMetaDataHandlerImpl(client)
    val columns: Seq[Column] = handler.getColumns(dbTest,testTable.name)
    assert(columns.nonEmpty)
    assert(columns.size == testTable.columns.size)

    assert(columns(0).isInstanceOf[Int32Column])
    assert(columns(0).name == "id")

    assert(columns(1).isInstanceOf[DateTimeColumn])
    assert(columns(1).name == "created_date")

    assert(columns(2).isInstanceOf[StringColumn])
    assert(columns(2).name == "location")

    assert(columns(3).isInstanceOf[StringColumn])
    assert(columns(3).name == "shop")

    assert(columns(4).isInstanceOf[StringColumn])
    assert(columns(4).name == "sale")

  }

  test("get columns of schemas from view from clickhouse") {
    val handler: ClickhouseMetaDataHandler = new ClickhouseMetaDataHandlerImpl(client)
    val columns: Seq[Column] = handler.getColumns(dbTest,testViewTable.name)
    assert(columns.nonEmpty)
    assert(columns.size == testTable.columns.size)

    assert(columns(0).isInstanceOf[Int32Column])
    assert(columns(0).name == "id")

    assert(columns(1).isInstanceOf[DateTimeColumn])
    assert(columns(1).name == "created_date")

    assert(columns(2).isInstanceOf[StringColumn])
    assert(columns(2).name == "location")

    assert(columns(3).isInstanceOf[StringColumn])
    assert(columns(3).name == "shop")

    assert(columns(4).isInstanceOf[StringColumn])
    assert(columns(4).name == "sale")

  }
}
