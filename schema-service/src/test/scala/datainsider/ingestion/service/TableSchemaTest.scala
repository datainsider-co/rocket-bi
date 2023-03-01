package datainsider.ingestion.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.MockCaasClientModule
import datainsider.ingestion.domain._
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.repository.SchemaRepository
import datainsider.ingestion.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfter

class TableSchemaTest extends IntegrationTest with BeforeAndAfter {
  override protected val injector: Injector =
    TestInjector(MockCaasClientModule, TestModule).newInstance()
  val schemaRepository: SchemaRepository = injector.instance[SchemaRepository]
  val schemaService: SchemaService = injector.instance[SchemaService]

  val testDbName: String = "db_test_1"
  val testTblName: String = "tbl_test"
  override def beforeAll(): Unit = {
    super.beforeAll()
    schemaRepository.createDatabase(1, testDbName, "test database").syncGet()
  }
  override def afterAll(): Unit = {
    super.afterAll()
    schemaRepository.dropDatabase(1, testDbName).syncGet()
  }

  val testColumn: Column = StringColumn(name = "c0", displayName = "c0", isNullable = true)
  val tableSchema: TableSchema = TableSchema(
    name = testTblName,
    dbName = testDbName,
    organizationId = 1,
    displayName = "create table",
    columns = Seq(testColumn),
    tableType = Some(TableType.Default)
  )

  test("create table schema test") {
    val result: TableSchema = schemaService.createTableSchema(tableSchema).syncGet()
    assert(result.equals(tableSchema))
  }

  test("update table type to view test") {
    schemaService.updateTableSchema(1, tableSchema.copy(tableType = Some(TableType.View))).syncGet()
    val updatedTableSchema: TableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    assert(updatedTableSchema.tableType.get.equals(TableType.View))
  }

  test("update table display name test") {
    val displayName = "updated schema"
    schemaService.updateTableSchema(1, tableSchema.copy(displayName = displayName)).syncGet()
    val updatedTableSchema: TableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    assert(updatedTableSchema.displayName.equals(displayName))
  }

  test("update column display name test") {
    val displayName = "updated column"
    val updateColumn = StringColumn(
      name = testColumn.name,
      displayName = displayName,
      isNullable = testColumn.isNullable
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = Seq(updateColumn))).syncGet()
    val updatedTableSchema: TableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    val updatedColumn = updatedTableSchema.columns.filter(_.name.equals(testColumn.name)).head
    assert(updatedColumn.displayName.equals(displayName))
  }

  test("update column default value test") {
    val defaultValue = "0"
    val updateColumn = StringColumn(
      name = testColumn.name,
      displayName = testColumn.displayName,
      isNullable = testColumn.isNullable,
      defaultValue = Some(defaultValue)
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = Seq(updateColumn))).syncGet()
    val updatedTableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    val updatedColumn = updatedTableSchema.columns.filter(_.name.equals(testColumn.name)).head
    assert(updatedColumn.asInstanceOf[StringColumn].defaultValue.get.equals(defaultValue))
  }

  test("update column type test") {
    val updateColumn = Int64Column(
      name = testColumn.name,
      displayName = testColumn.displayName,
      isNullable = testColumn.isNullable
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = Seq(updateColumn))).syncGet()
    val updatedTableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    val updatedColumn = updatedTableSchema.columns.filter(_.name.equals(testColumn.name)).head
    assert(updatedColumn.isInstanceOf[Int64Column])
  }

  test("update column nullable test") {
    val updateColumn = StringColumn(
      name = testColumn.name,
      displayName = testColumn.displayName,
      isNullable = true
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = Seq(updateColumn))).syncGet()
    val updatedTableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    val updatedColumn = updatedTableSchema.columns.filter(_.name.equals(testColumn.name)).head
    assert(updatedColumn.isNullable)
  }

  test("update column description test") {
    val description: String = "test"
    val updateColumn = StringColumn(
      name = testColumn.name,
      displayName = testColumn.displayName,
      isNullable = testColumn.isNullable,
      description = Some(description)
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = Seq(updateColumn))).syncGet()
    val updatedTableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    val updatedColumn = updatedTableSchema.columns.filter(_.name.equals(testColumn.name)).head
    assert(updatedColumn.description.get.equals(description))
  }

  test("add column test") {
    val newColumn = StringColumn(
      name = "new_column",
      displayName = "new column",
      isNullable = true
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = Seq(testColumn, newColumn))).syncGet()
    val updatedTableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    assert(updatedTableSchema.columns.length == 2)
    assert(updatedTableSchema.findColumn(testColumn.name).nonEmpty)
    assert(updatedTableSchema.findColumn("new_column").nonEmpty)
  }

  test("drop column test") {
    schemaService.updateTableSchema(1, tableSchema.copy(columns = Seq(testColumn))).syncGet()
    val updatedTableSchema = schemaService.getTableSchema(1, testDbName, testTblName).syncGet()
    assert(updatedTableSchema.columns.length == 1)
    assert(updatedTableSchema.findColumn(testColumn.name).nonEmpty)
    assert(updatedTableSchema.findColumn("new_column").isEmpty)
  }
}
