package datainsider.ingestion.repository

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.{JdbcClient, NativeJdbcClient, ZConfig}
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.DataCookTestModule
import datainsider.ingestion.domain._
import datainsider.ingestion.misc.ClickHouseDDLConverter
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

class NonClusteredDDLExecutorTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = DiTestInjector(TestModule).newInstance()

  private val client = injector.instance[JdbcClient]
  private val ddlExecutor = NonClusteredDDLExecutor(client)

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
