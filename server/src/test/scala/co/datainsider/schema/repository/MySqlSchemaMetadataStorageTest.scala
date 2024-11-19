package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema, TableStatus, TableType}
import com.google.inject.name.{Named, Names}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import co.datainsider.bi.util.Implicits.FutureEnhance

class MySqlSchemaMetadataStorageTest extends IntegrationTest {
  val injector: Injector = TestInjector(TestContainerModule).create
  val client: JdbcClient = injector.instance[JdbcClient](Names.named("mysql"))

  private val schemaMetadataStorage = new MySqlSchemaMetadataStorage(client)
  private val orgId = 0L
  private val dbSchema = DatabaseSchema(
    name = "sales",
    organizationId = orgId,
    displayName = "Sales",
    creatorId = "user_a",
    tables = Seq(
      TableSchema(
        name = "orders",
        dbName = "sales",
        organizationId = orgId,
        displayName = "Sales",
        columns = Seq(
          Int32Column("id", "Id"),
          StringColumn("item_name", "Item Name"),
          DoubleColumn("price", "Price")
        ),
        tableType = Some(TableType.Default),
        tableStatus = Some(TableStatus.Normal),
        query = Some("select 1")
      )
    )
  )

  private val tblSchema = dbSchema.tables.head

  test("test ensure schema") {
    val schemaOk: Boolean = schemaMetadataStorage.ensureSchema().syncGet()
    assert(schemaOk)
  }

  test("test add db metadata") {
    val addOk: Boolean = schemaMetadataStorage.addDatabase(orgId, dbSchema).syncGet()
    assert(addOk)
  }

  test("test exists db metadata") {
    val existDb: Boolean = schemaMetadataStorage.isExists(orgId, dbSchema.name).syncGet()
    assert(existDb)
  }

  test("test add table metadata") {
    val addOk: Boolean = schemaMetadataStorage.addTable(orgId, dbSchema.name, tblSchema.copy("copied")).syncGet()
    assert(addOk)
    schemaMetadataStorage.dropTable(orgId, dbSchema.name, "copied")
  }

  test("test exist table metadata") {
    val existTable: Boolean = schemaMetadataStorage.isExists(orgId, dbSchema.name, tblSchema.name).syncGet()
    assert(existTable)
  }

  test("test get database schema") {
    val database: DatabaseSchema = schemaMetadataStorage.getDatabaseSchema(orgId, dbSchema.name).syncGet()
    assert(database.tables.length == 1)
  }

  test("test get database by name") {
    val database: DatabaseSchema = schemaMetadataStorage.getDatabaseSchema(dbSchema.name).syncGet()
    assert(database.tables.length == 1)
  }

  test("test get databases by names") {
    val databases = schemaMetadataStorage.getDatabaseSchemas(orgId, Seq(dbSchema.name)).syncGet()
    assert(databases.nonEmpty)
  }

  test("test get all databases by org") {
    val databases = schemaMetadataStorage.getDatabases(orgId).syncGet()
    assert(databases.nonEmpty)
  }

  test("test get all databases short info") {
    val databases = schemaMetadataStorage.getDatabaseShortInfos(orgId).syncGet()
    assert(databases.nonEmpty)
  }

  test("test get table") {
    val table: TableSchema = schemaMetadataStorage.getTable(orgId, tblSchema.dbName, tblSchema.name).syncGet()
    assert(table.columns.length == 3)
    assert(table.tableType.contains(TableType.Default))
    assert(table.tableStatus.contains(TableStatus.Normal))
    assert(table.query.contains("select 1"))
  }

  test("test add column") {
    val updateOk = schemaMetadataStorage
      .addColumns(
        orgId,
        tblSchema.dbName,
        tblSchema.name,
        Seq(
          DoubleColumn("total", "Total")
        )
      )
      .syncGet()
    assert(updateOk)
  }

  test("test update column") {
    val updateOk = schemaMetadataStorage
      .updateColumn(orgId, tblSchema.dbName, tblSchema.name, Int64Column("total", "Total"))
      .syncGet()
    assert(updateOk)
  }

  test("test drop column") {
    val updateOk = schemaMetadataStorage.dropColumn(orgId, tblSchema.dbName, tblSchema.name, "total").syncGet()
    assert(updateOk)
  }

  test("test rename table schema") {
    val newTblName = "new_table"
    val renameOk: Boolean = schemaMetadataStorage
      .renameTable(
        organizationId = orgId,
        dbName = tblSchema.dbName,
        tblName = tblSchema.name,
        newTblName = newTblName
      )
      .syncGet()
    assert(renameOk)

    schemaMetadataStorage.renameTable(orgId, tblSchema.dbName, newTblName, tblSchema.name).syncGet()
  }

  test("test add expression column") {
    val addOk: Boolean = schemaMetadataStorage
      .addExpressionColumn(
        organizationId = orgId,
        dbName = tblSchema.dbName,
        tblName = tblSchema.name,
        newExpColumn = DoubleColumn(
          name = "total_sales",
          displayName = "Total Sales",
          defaultExpression = Some(DefaultExpression(DefaultTypes.MEASURED, "sum(price)"))
        )
      )
      .syncGet()
    assert(addOk)
  }

  test("test update expression column") {
    val updateOk: Boolean = schemaMetadataStorage
      .updateExpressionColumn(
        organizationId = orgId,
        dbName = tblSchema.dbName,
        tblName = tblSchema.name,
        newExpColumn = DoubleColumn(
          name = "total_sales",
          displayName = "Total Sales",
          defaultExpression = Some(DefaultExpression(DefaultTypes.MEASURED, "sum(amount * price)"))
        )
      )
      .syncGet()
    assert(updateOk)
  }

  test("test get expression column") {
    val exprColumn: Option[Column] =
      schemaMetadataStorage.getExpressionColumn(orgId, tblSchema.dbName, tblSchema.name, "total_sales").syncGet()
    assert(exprColumn.isDefined)
    assert(exprColumn.get.defaultExpression.contains(DefaultExpression(DefaultTypes.MEASURED, "sum(amount * price)")))
  }

  test("test delete expression column") {
    val deleteOk: Boolean =
      schemaMetadataStorage.dropExpressionColumn(orgId, tblSchema.dbName, tblSchema.name, "total_sales").syncGet()
    assert(deleteOk)
  }

  test("test add calculated column") {
    val addOk: Boolean = schemaMetadataStorage
      .addCalculatedColumn(
        organizationId = orgId,
        dbName = tblSchema.dbName,
        tblName = tblSchema.name,
        newCalcColumn = DoubleColumn(
          name = "sales_usd",
          displayName = "Sales Usd",
          defaultExpression = Some(DefaultExpression(DefaultTypes.CALCULATED, "price / 23000"))
        )
      )
      .syncGet()
    assert(addOk)
  }

  test("test update calculated column") {
    val updateOk: Boolean = schemaMetadataStorage
      .updateCalculatedColumn(
        organizationId = orgId,
        dbName = tblSchema.dbName,
        tblName = tblSchema.name,
        newCalcColumn = DoubleColumn(
          name = "sales_usd",
          displayName = "Sales Usd",
          defaultExpression = Some(DefaultExpression(DefaultTypes.MEASURED, "(price * amount) / 23000"))
        )
      )
      .syncGet()
    assert(updateOk)
  }

  test("test delete calculated column") {
    val deleteOk: Boolean =
      schemaMetadataStorage.dropCalculatedColumn(orgId, tblSchema.dbName, tblSchema.name, "sales_usd").syncGet()
    assert(deleteOk)
  }

  test("test delete table metadata") {
    val deleteOk: Boolean = schemaMetadataStorage.dropTable(orgId, dbSchema.name, tblSchema.name).syncGet()
    assert(deleteOk)
  }

  test("test delete db metadata") {
    val deleteOk: Boolean = schemaMetadataStorage.hardDelete(orgId, dbSchema.name).syncGet()
    assert(deleteOk)
  }

}
