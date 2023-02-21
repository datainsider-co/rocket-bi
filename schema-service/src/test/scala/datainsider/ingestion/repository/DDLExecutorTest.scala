package datainsider.ingestion.repository

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import datainsider.ingestion.domain.{StringColumn, TableSchema, UInt32Column}
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

class DDLExecutorTest extends IntegrationTest with BeforeAndAfterAll {
  override val injector: Injector = TestInjector(TestModule).newInstance()

  val ddlExecutor: DDLExecutor = injector.instance[DDLExecutor]

  val dbName = "database_test3"
  val tableSchema: TableSchema = TableSchema(
    name = "table_test",
    dbName = dbName,
    organizationId = 1L,
    displayName = "Test table",
    columns = Seq(
      UInt32Column("id", "Id"),
      StringColumn("name", "Name")
    )
  )

  test("test create database") {
    val success = ddlExecutor.createDatabase(dbName).syncGet()
    assert(success)

    val isDbExists: Boolean = ddlExecutor.existsDatabaseSchema(dbName).syncGet()
    assert(isDbExists)
  }

  test("test create table on cluster") {
    val success = ddlExecutor.createTable(tableSchema).syncGet()
    assert(success)

    val isTableExisted: Boolean = ddlExecutor
      .existTableSchema(
        dbName = tableSchema.dbName,
        tblName = tableSchema.name,
        colNames = tableSchema.columns.map(_.name)
      )
      .syncGet()

    assert(isTableExisted)
  }

  test("test add column to table in cluster") {
    val success = ddlExecutor.addColumn(dbName, tableSchema.name, UInt32Column("age", "Age")).syncGet()
    assert(success)

    val isColAdded: Boolean = ddlExecutor
      .existTableSchema(
        dbName = tableSchema.dbName,
        tblName = tableSchema.name,
        colNames = Seq("age")
      )
      .syncGet()

    assert(isColAdded)
  }

  test("test drop column of a table in cluster") {
    val success = ddlExecutor.dropColumn(dbName, tableSchema.name, "age").syncGet()
    assert(success)

    val isColExists: Boolean = ddlExecutor
      .existTableSchema(
        dbName = tableSchema.dbName,
        tblName = tableSchema.name,
        colNames = Seq("age")
      )
      .syncGet()

    assert(!isColExists)
  }

  val renamedTblName = "table_renamed"

  test("test rename table in cluster") {
    val success = ddlExecutor.renameTable(dbName, tableSchema.name, renamedTblName).syncGet()
    assert(success)

    val isTblRenamed: Boolean = ddlExecutor
      .existTableSchema(
        dbName = tableSchema.dbName,
        tblName = renamedTblName
      )
      .syncGet()

    assert(isTblRenamed)
  }

  test("test drop table on cluster") {
    val success = ddlExecutor.dropTable(dbName, renamedTblName).syncGet()
    assert(success)

    val isTableExisted: Boolean = ddlExecutor
      .existTableSchema(
        dbName = tableSchema.dbName,
        tblName = renamedTblName
      )
      .syncGet()

    assert(!isTableExisted)
  }

  test("test drop database") {
    val success = ddlExecutor.dropDatabase(dbName).syncGet()
    assert(success)

    val isDbExists: Boolean = ddlExecutor.existsDatabaseSchema(dbName).syncGet()
    assert(!isDbExists)
  }

}
