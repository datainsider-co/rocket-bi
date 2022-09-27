package datainsider.schema.repository

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.schema.domain.TableSchema
import datainsider.schema.domain.column._
import datainsider.schema.module.TestModule
import datainsider.schema.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

class DDLExecutorTest extends IntegrationTest with BeforeAndAfterAll {
  override val injector: Injector = TestInjector(TestModule).newInstance()

  override def beforeAll(): Unit = {
    super.beforeAll()
    ddlExecutor.dropDatabase(dbName).syncGet()
  }

  val ddlExecutor: DDLExecutor = injector.instance[DDLExecutor]
  val dbName = "database_test"
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
  val newTblName = "renamed"

  test("test create database") {
    val success = ddlExecutor.createDatabase(dbName).syncGet()
    assert(success)
  }

  test("test create table on cluster") {
    val success = ddlExecutor.createTable(tableSchema).syncGet()
    assert(success)
  }

  test("test add column to table in cluster") {
    val success = ddlExecutor.addColumn(dbName, tableSchema.name, UInt32Column("age", "Age")).syncGet()
    assert(success)
  }

  test("test rename column in table in cluster") {
    val success = ddlExecutor.renameTable(dbName, tableSchema.name, newTblName).syncGet()
    assert(success)
  }

  test("test drop column of a table in cluster") {
    val success = ddlExecutor.dropColumn(dbName, newTblName, "age").syncGet()
    assert(success)
  }

  test("test drop table on cluster") {
    val success = ddlExecutor.dropTable(dbName, newTblName).syncGet()
    assert(success)
  }

  test("test drop database") {
    val success = ddlExecutor.dropDatabase(dbName).syncGet()
    assert(success)
  }

}
