package co.datainsider.schema.repository

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.clickhouse.{ClickhouseEngine, ClickhouseEngineFactory}
import co.datainsider.bi.module.{TestBIClientModule, TestCommonModule, TestContainerModule, TestModule}
import co.datainsider.bi.service.ConnectionService
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.{TableSchema, TableType}
import co.datainsider.schema.module.SchemaTestModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import co.datainsider.bi.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

/**
  * @author andy
  * @since 7/10/20
  */
class ClusteredDDLExecutorTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector =
    TestInjector(SchemaTestModule, MockCaasClientModule, TestContainerModule, TestModule, TestBIClientModule, TestCommonModule)
      .newInstance()
  private val orgId = 1
  val connectionService: ConnectionService = injector.instance[ConnectionService]
  val source: ClickhouseConnection = await(connectionService.get(orgId)).asInstanceOf[ClickhouseConnection]
  val clickhouseEngineCreator = new ClickhouseEngineFactory()
  val clickhouseEngine: ClickhouseEngine = clickhouseEngineCreator.create(source)
  val ddlExecutor: DDLExecutor = clickhouseEngine.getDDLExecutor()

  val testCreateDbName = "testdb"
  val testCreateTableName = "transaction"
  val testCreateReplacingTableName = "profit"

  override protected def beforeAll(): Unit = {
    super.beforeAll()

    val isExists = ddlExecutor.existsDatabaseSchema(testCreateDbName).syncGet()
    if (isExists)
      ddlExecutor.dropDatabase(testCreateDbName).syncGet()
  }

  test("Get databases") {
    val databases = ddlExecutor.getDbNames().syncGet()

    databases.foreach(println(_))
    assert(databases != null)
    assert(databases.nonEmpty)
  }

  test("Get databases and tables") {
    val databases = ddlExecutor.getDbNames().syncGet()
    assert(databases != null)
    assert(databases.nonEmpty)

    val fnList = Future.collect(databases.map(ddlExecutor.getTableNames(_)))
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
        StringColumn("sale", "Sale"),
        StringColumn("cost", "cost")
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
    val column = Int32Column("cost", "cost")
    val isOK = ddlExecutor.updateColumn(testCreateDbName, testCreateTableName, column).syncGet()
    assert(isOK)
  }
  test("Delete column") {
    assert(ddlExecutor.dropColumn(testCreateDbName, testCreateTableName, "cost").syncGet())
  }
}
