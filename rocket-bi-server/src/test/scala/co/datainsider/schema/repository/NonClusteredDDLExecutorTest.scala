package co.datainsider.schema.repository

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.bi.service.ConnectionService
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{StringColumn, UInt32Column}
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaTestModule}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

class NonClusteredDDLExecutorTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector =
    TestInjector(SchemaTestModule, TestContainerModule, TestModule, MockSchemaClientModule).newInstance()

  private val orgId = 1
  val clickhouseEngine = injector.instance[Engine[ClickhouseConnection]].asInstanceOf[ClickhouseEngine]
  val connectionService = injector.instance[ConnectionService]
  val source: ClickhouseConnection = await(connectionService.getOriginConnection(orgId)).asInstanceOf[ClickhouseConnection]
  val ddlExecutor: DDLExecutor = clickhouseEngine.getDDLExecutor(source)

  private val dbName = "db_test"
  private val tblName = "test_table"

  test("test create database") {
    val dbCreated: Boolean = ddlExecutor.createDatabase(dbName).syncGet()
    assert(dbCreated)

    val isDbExists: Boolean = ddlExecutor.existsDatabaseSchema(dbName).syncGet()
    assert(isDbExists)
  }

  test("test create table") {
    val tableSchema = TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = 0,
      displayName = tblName,
      columns = Seq(
        StringColumn("name", "Name"),
        UInt32Column("age", "Age")
      )
    )

    val tableCreated: Boolean = ddlExecutor.createTable(tableSchema).syncGet()
    assert(tableCreated)

    val isTblExists: Boolean = ddlExecutor.existTableSchema(dbName, tblName, Seq("name", "age")).syncGet()
    assert(isTblExists)
  }

  test("test rename table") {
    val tableRenamed: Boolean = ddlExecutor.renameTable(dbName, tblName, "new_name").syncGet()
    assert(tableRenamed)

    val isTblRenamed: Boolean = ddlExecutor.existTableSchema(dbName, "new_name").syncGet()
    assert(isTblRenamed)

    val revertTblName: Boolean = ddlExecutor.renameTable(dbName, "new_name", tblName).syncGet()
    assert(revertTblName)
  }

  test("test create column") {
    val newColumn = StringColumn("address", "Address")
    val colAdded: Boolean = ddlExecutor.addColumn(dbName, tblName, newColumn).syncGet()
    assert(colAdded)

    val isColAdded: Boolean = ddlExecutor.existTableSchema(dbName, tblName, Seq("name", "age", "address")).syncGet()
    assert(isColAdded)
  }

  test("test drop column") {
    val colDropped: Boolean = ddlExecutor.dropColumn(dbName, tblName, "address").syncGet()
    assert(colDropped)

    val isColDropped: Boolean = ddlExecutor.existTableSchema(dbName, tblName, Seq("name", "age", "address")).syncGet()
    assert(!isColDropped)
  }

  test("test drop table") {
    val tableDropped: Boolean = ddlExecutor.dropTable(dbName, tblName).syncGet()
    assert(tableDropped)

    val isTblExists: Boolean = ddlExecutor.existTableSchema(dbName, tblName).syncGet()
    assert(!isTblExists)

  }

  test("test drop database") {
    val deleteOk = ddlExecutor.dropDatabase(dbName).syncGet()
    assert(deleteOk)

    val isDbExists = ddlExecutor.existsDatabaseSchema(dbName).syncGet()
    assert(!isDbExists)
  }
}
