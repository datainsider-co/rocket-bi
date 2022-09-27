package datainsider.schema.service

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.{NativeJdbcClient, ZConfig}
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.misc.ClickHouseDDLConverter
import datainsider.schema.module.{DiTestInjector, TestModule}
import datainsider.schema.repository.{DDLExecutor, DDLExecutorImpl}
import datainsider.schema.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

/**
  * @author andy
  * @since 7/10/20
 **/
class DDLExecutorTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = DiTestInjector(TestModule, MockCaasClientModule).newInstance()

  var ddlExecutor: DDLExecutor = null

  val testCreateDbName = "testdb"
  val testCreateTableName = "transaction"
  val testCreateReplacingTableName = "profit"

  override protected def beforeAll(): Unit = {
    super.beforeAll()
    val driverClass: String = ZConfig.getString("db.clickhouse.driver_class")
    val jdbcUrl: String = ZConfig.getString("db.clickhouse.url")
    val user: String = ZConfig.getString("db.clickhouse.user")
    val password: String = ZConfig.getString("db.clickhouse.password")
    val clusterName: String = ZConfig.getString("db.clickhouse.cluster_name")

    val client = NativeJdbcClient(jdbcUrl, user, password)

    ddlExecutor = DDLExecutorImpl(client, ClickHouseDDLConverter(), clusterName)

    val isExists = ddlExecutor.existsDatabaseSchema(testCreateDbName).syncGet()
    if (isExists)
      ddlExecutor.dropDatabase(testCreateDbName).syncGet()
  }

  test("Get databases") {
    val databases = ddlExecutor.getDatabases().syncGet()

    databases.foreach(println(_))
    assert(databases != null)
    assert(databases.nonEmpty)
  }

  test("Get databases and tables") {
    val databases = ddlExecutor.getDatabases().syncGet()
    assert(databases != null)
    assert(databases.nonEmpty)

    val fnList = Future.collect(databases.map(ddlExecutor.getTables(_)))
    val tableByDatabases = fnList.syncGet()
    databases.zipWithIndex.foreach {
      case (dbName, index) =>
        val tables = tableByDatabases(index)
        println(s"""
             |----------------------------------------
             |Database: ${dbName}
             |Table: ${tables.size}
             |${tables.mkString("\n\t+ ")}
             |""".stripMargin)
    }

  }

  test("Create databases") {

    val isOK = ddlExecutor.createDatabase(testCreateDbName).syncGet()
    assert(isOK)
  }

  test("Create table") {

    val createRequest = TableSchema(
      testCreateTableName,
      testCreateDbName,
      1L,
      testCreateTableName,
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
    val isOK = ddlExecutor.createTable(createRequest).syncGet()
    val isExists = ddlExecutor.existTableSchema(testCreateDbName, testCreateTableName).syncGet()
    assert(isOK && isExists)
  }

  test("Create table with materialized columns") {
    val createRequest = TableSchema(
      testCreateTableName,
      testCreateDbName,
      1L,
      testCreateTableName,
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
    val isOK = ddlExecutor.createTable(createRequest).syncGet()
    val isExists = ddlExecutor.existTableSchema(testCreateDbName, testCreateTableName).syncGet()
    assert(isOK && isExists)
  }

  test("Create replacing table") {

    val createRequest = TableSchema(
      testCreateReplacingTableName,
      testCreateDbName,
      1L,
      testCreateReplacingTableName,
      Seq(
        Int32Column("id", "Id"),
        StringColumn("name", "Name", defaultValue = Some("Thien Vi")),
        DoubleColumn("profit", "profit")
      ),
      orderBys = Seq("id"),
      tableType = Some(TableType.Replacing)
    )
    val isOK = ddlExecutor.createTable(createRequest).syncGet()
    val isExists = ddlExecutor.existTableSchema(testCreateDbName, testCreateReplacingTableName).syncGet()
    assert(isOK && isExists)
  }

  protected override def afterAll(): Unit = {
    super.afterAll()
    val dropOK = ddlExecutor.dropDatabase(testCreateDbName).syncGet()
    assert(dropOK)
  }

  test("Update column") {
    val column = StringColumn("cost", "cost")
    val isOK = ddlExecutor.updateColumn(testCreateDbName, testCreateTableName, column).syncGet()
    assert(isOK)
  }
  test("Delete column") {
    assert(ddlExecutor.dropColumn(testCreateDbName, testCreateTableName, "cost").syncGet())
  }
}
