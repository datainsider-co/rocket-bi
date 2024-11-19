package co.datainsider.bi.engine.mysql

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.util.ZConfig
import co.datainsider.common.client.exception.{DbExecuteError, InternalError, UnsupportedError}
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.{TableSchema, TableType}
import com.twitter.inject.Test
import com.twitter.inject.app.TestInjector
import org.scalatest.exceptions.TestFailedException

import scala.util.Try

/**
  * created 2023-06-27 2:29 PM
  *
  * @author tvc12 - Thien Vi
  */
class MySqlDDLExecutorTest extends Test {
  val injector = TestInjector(TestContainerModule).create
  val source: MysqlConnection = injector.instance[MysqlConnection]
  val engineCreator = new MysqlEngineFactory(
    defaultProperties = ZConfig.getStringMap("mysql_engine.default_properties", Map.empty)
  )
  val engine = engineCreator.create(source)
  val dbName = "test"
  var tableName = "default_table"
  var viewTblName = "view_table"
  var materializedViewTblName = "materialized_view_table"
  val client = engine.client
  val ddlExecutor = engine.getDDLExecutor()
  private val orgId = 1
  private val defaultTableSchema = createTable(dbName, tableName)
  private val viewTableSchema = createTable(dbName, viewTblName).copy(
    tableType = Some(TableType.View),
    query = Some(s"select * from ${dbName}.${tableName}")
  )
  private val materializedTableSchema = createTable(dbName, materializedViewTblName).copy(
    tableType = Some(TableType.Materialized),
    query = Some(s"select * from ${dbName}.${tableName}")
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    cleanup()
  }

  override def afterAll(): Unit = {
    super.afterAll()
    cleanup()
    Try(engine.close())
  }

  private def cleanup(): Unit = {
    try {
      client.executeUpdate(s"drop database if exists ${dbName}")
    } catch {
      case _: Throwable => //ignore
    }
  }

  test("Create databases success") {
    val isSuccess: Boolean = await(ddlExecutor.createDatabase(dbName))
    assert(isSuccess)
  }

  test("Create database already exists") {
    val isSuccess: Boolean = await(ddlExecutor.createDatabase(dbName))
    assert(isSuccess)
  }

  test("Check database existed") {
    val isExisted: Boolean = await(ddlExecutor.existsDatabaseSchema(dbName))
    assert(isExisted)
  }

  test("[Default Table] test create table success") {
    val isSuccess: Boolean = await(ddlExecutor.createTable(defaultTableSchema))
    assert(isSuccess)
  }

  test("[Default Table] test create table already exists") {
    val isSuccess: Boolean = await(ddlExecutor.createTable(defaultTableSchema))
    assert(isSuccess)
  }

  test("[View Table] test create table success") {
    val isSuccess: Boolean = await(ddlExecutor.createTable(viewTableSchema))
    assert(isSuccess)
  }

  test("[View Table] test create table already exists") {
    assertFailedFuture[Throwable](ddlExecutor.createTable(viewTableSchema))
  }

  test("[Materialized View] test create table ") {
    assertFailedFuture[UnsupportedError](ddlExecutor.createTable(materializedTableSchema))
  }

  test("Check table existed") {
    val isExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, tableName))
    assert(isExisted)
  }

  test("Check table note existed") {
    val isExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, "fake_table"))
    assert(!isExisted)
  }

  test("List database names") {
    val databases: Seq[String] = await(ddlExecutor.getDbNames())
    assert(databases.nonEmpty)
    assert(databases.contains(dbName))
  }

  test("List table names") {
    val tables: Seq[String] = await(ddlExecutor.getTableNames(dbName))
    assert(tables.nonEmpty)
    assert(tables.contains(tableName))
    assert(tables.contains(viewTblName))
    assert(!tables.contains(materializedViewTblName))
  }

  test("List table not exists") {
    assertFailedFuture[Throwable](ddlExecutor.getTableNames("not_exists"))
  }

  test("List column names") {
    val columnNames: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
    assertColumnNames(columnNames)
  }

  test("List column names not exists") {
    assertFailedFuture[Throwable](ddlExecutor.getColumnNames(dbName, "not_exists"))
  }

  test("Scan tables") {
    val tables: Seq[TableSchema] = await(ddlExecutor.scanTables(orgId, dbName))
    assert(tables.nonEmpty)
    assert(tables.size == 2)
    assert(tables.exists(_.name == tableName))
    assert(tables.exists(_.name == viewTblName))
    assert(!tables.exists(_.name == materializedViewTblName))
    val defaultTable: TableSchema = tables.find(_.name == tableName).get
    val viewTable: TableSchema = tables.find(_.name == viewTblName).get
    assertTable(defaultTable, defaultTableSchema)
    assertTable(viewTable, viewTableSchema)
  }

  test("[View Table] test rename table") {
    val oldTableName = viewTblName
    viewTblName = "new_view_table"
    val isSuccess: Boolean = await(ddlExecutor.renameTable(dbName, oldTableName, viewTblName))
    assert(isSuccess)
    testExistTable(dbName, oldTableName, false)
    testExistTable(dbName, viewTblName, true)
  }

  test("[Default Table] test rename") {
    val oldTableName = tableName
    tableName = "new_default_table"
    val isSuccess: Boolean = await(ddlExecutor.renameTable(dbName, oldTableName, tableName))
    assert(isSuccess)
    testExistTable(dbName, oldTableName, false)
    testExistTable(dbName, tableName, true)
  }

  test("Rename table not exists") {
    val newTableName = "not_exists_table"
    assertFailedFuture[Throwable](ddlExecutor.renameTable(dbName, "not_exists", newTableName))
  }

  test("[Default Table] test add column success") {
    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
    val isSuccess: Boolean = await(ddlExecutor.addColumn(dbName, tableName, newColumn))
    assert(isSuccess)
    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
    assert(columns.contains(newColumn.name))
  }

  test("[Default Table] test add column already exists") {
    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
    assertFailedFuture[InternalError](ddlExecutor.addColumn(dbName, tableName, newColumn))
  }

  test("[View Table] test add column failed") {
    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
    assertFailedFuture[InternalError](ddlExecutor.addColumn(dbName, viewTblName, newColumn))
  }

  test("Add column to table not exists") {
    val newColumn = StringColumn("new_column", "new_column", isNullable = false)
    assertFailedFuture[InternalError](ddlExecutor.addColumn(dbName, "not_exists", newColumn))
  }

  test("[Default Table] test add columns") {
    val newColumns = Seq(
      Int64Column("new_column1", "new_column1", isNullable = true),
      Int64Column("new_column2", "new_column2", defaultValue = Some(1), isNullable = true),
      FloatColumn("new_column3", "new_column3", defaultValue = Some(1.2f), isNullable = true),
      DateTimeColumn("new_column4", "new_column4", defaultValue = Some(System.currentTimeMillis()), isNullable = true),
      DateColumn("new_column5", "new_column5", defaultValue = Some(System.currentTimeMillis()), isNullable = true)
    )
    val isSuccess: Boolean = await(ddlExecutor.addColumns(dbName, tableName, newColumns))
    assert(isSuccess)
    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
    assert(columns.contains(newColumns.head.name))
  }

  test("[Default Table] test update column int to string") {
    val newColumn = StringColumn("age", "age", isNullable = true)
    val success = await(ddlExecutor.updateColumn(dbName, tableName, newColumn))
    assert(success)
    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
    assert(columns.contains(newColumn.name))
  }

  test("[Default Table] test update column float to int") {
    val newColumn = Int64Column("salary", "salary", isNullable = false)
    val isSuccess: Boolean = await(ddlExecutor.updateColumn(dbName, tableName, newColumn))
    assert(isSuccess)
    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
    assert(columns.contains(newColumn.name))
  }

  test("[Default Table] test update column required to nullable") {
    val newColumn = Int64Column("salary", "salary", isNullable = true)
    val isSuccess: Boolean = await(ddlExecutor.updateColumn(dbName, tableName, newColumn))
    assert(isSuccess)
    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
    assert(columns.contains(newColumn.name))
  }

  test("Update column not exists") {
    val newColumn = StringColumn("not_exists", "not_exists", isNullable = true)
    assertFailedFuture[Throwable](ddlExecutor.updateColumn(dbName, tableName, newColumn))
  }

  test("[Default Table] drop column") {
    val isSuccess: Boolean = await(ddlExecutor.dropColumn(dbName, tableName, "new_column"))
    assert(isSuccess)
    val columns: Set[String] = await(ddlExecutor.getColumnNames(dbName, tableName))
    assert(!columns.contains("new_column"))
  }

  test("[View Table] drop column") {
    assertFailedFuture[InternalError](ddlExecutor.dropColumn(dbName, viewTblName, "new_column"))
  }

  test("[Materialized View] drop column") {
    assertFailedFuture[InternalError](ddlExecutor.dropColumn(dbName, materializedViewTblName, "new_column"))
  }

  test("Drop column not exists") {
    assertFailedFuture[InternalError](ddlExecutor.dropColumn(dbName, tableName, "not_exists"))
  }

  test("[View Table] drop table") {
    val isSuccess: Boolean = await(ddlExecutor.dropTable(dbName, viewTblName, TableType.View))
    assert(isSuccess)
    val isTableExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, viewTblName))
    assert(!isTableExisted)
  }

  test("[Default Table] drop table") {
    val isSuccess: Boolean = await(ddlExecutor.dropTable(dbName, tableName, TableType.Default))
    assert(isSuccess)
    val isTableExisted: Boolean = await(ddlExecutor.existTableSchema(dbName, tableName))
    assert(!isTableExisted)
  }

  test("Drop table not exists") {
    val isSuccess: Boolean = await(ddlExecutor.dropTable(dbName, "not_exists", TableType.Default))
    assert(isSuccess)
  }

  test("Drop database") {
    val isSuccess: Boolean = await(ddlExecutor.dropDatabase(dbName))
    assert(isSuccess)
    val isDbExisted: Boolean = await(ddlExecutor.existsDatabaseSchema(dbName))
    assert(!isDbExisted)
  }

  test("Drop database not exists") {
    val result: Boolean = await(ddlExecutor.dropDatabase("not_exists"))
    assert(result)
  }

  test("[Detect columns] SELECT 1") {
    val columns: Seq[Column] = await(ddlExecutor.detectColumns("select 1 as id"))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 1)(columns.length)
    val column: Column = columns.head;
    assert(column.getClass == classOf[Int32Column])
    assertResult(expected = "id")(column.displayName)
    assertResult(expected = "id")(column.name)
    assertResult(expected = false)(column.isNullable)
  }

  test("[Detect columns] text, number and date time") {
    val query =
      "select 'text' as text, 1 as number, CAST('99999999999999999999999999' as SIGNED) as long_number, CAST('2020-01-01 00:00:00' as DATETIME) as datetime"
    val columns: Seq[Column] = await(ddlExecutor.detectColumns(query))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 4)(columns.length)
    val textColumn: Column = columns.head;
    assert(textColumn.getClass == classOf[StringColumn])
    assertResult(expected = "text")(textColumn.displayName)
    assertResult(expected = "text")(textColumn.name)
    assertResult(expected = false)(textColumn.isNullable)
    val numberColumn: Column = columns(1);
    assert(numberColumn.getClass == classOf[Int32Column])
    assertResult(expected = "number")(numberColumn.displayName)
    assertResult(expected = "number")(numberColumn.name)
    assertResult(expected = false)(numberColumn.isNullable)
    val longNumberColumn: Column = columns(2);
    assert(longNumberColumn.getClass == classOf[Int64Column])
    assertResult(expected = "long_number")(longNumberColumn.displayName)
    assertResult(expected = "long_number")(longNumberColumn.name)
    assertResult(expected = false)(longNumberColumn.isNullable)
    val datetimeColumn: Column = columns(3);
    assert(datetimeColumn.getClass == classOf[DateTimeColumn])
    assertResult(expected = "datetime")(datetimeColumn.displayName)
    assertResult(expected = "datetime")(datetimeColumn.name)
    assertResult(expected = true)(datetimeColumn.isNullable)
  }

  test("[Detect columns] detect double, date") {
    val query = "select 1.0 as 'double', CAST('2020-01-01' as DATE) as date"
    val columns: Seq[Column] = await(ddlExecutor.detectColumns(query))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 2)(columns.length)
    val doubleColumn: Column = columns.head;
    assert(doubleColumn.getClass == classOf[DoubleColumn])
    assertResult(expected = "double")(doubleColumn.displayName)
    assertResult(expected = "double")(doubleColumn.name)
    assertResult(expected = false)(doubleColumn.isNullable)
    val dateColumn: Column = columns(1);
    assert(dateColumn.getClass == classOf[DateColumn])
    assertResult(expected = "date")(dateColumn.displayName)
    assertResult(expected = "date")(dateColumn.name)
    assertResult(expected = true)(dateColumn.isNullable)
  }

  test("[Detect columns] with wrongs syntax") {
    assertFailedFuture[DbExecuteError](ddlExecutor.detectColumns("select 1 as"))
  }

  private def assertTable(actualSchema: TableSchema, expectedSchema: TableSchema): Unit = {
    println(
      s"actual schema:: name: ${actualSchema.name}, columns_size: ${actualSchema.columns.size}, type: ${actualSchema.getTableType}"
    )
    assert(actualSchema.name == expectedSchema.name)
    assert(actualSchema.dbName == expectedSchema.dbName)
    assert(actualSchema.columns.size == expectedSchema.columns.size)
    assert(actualSchema.tableType == expectedSchema.tableType)
    assert(actualSchema.query.isDefined == expectedSchema.query.isDefined)
    actualSchema.columns.foreach(actualColumn => {
      assert(expectedSchema.columns.exists(_.name == actualColumn.name))
      val expectedColumn: Column = expectedSchema.columns.find(_.name == actualColumn.name).get
      assertColumn(actualSchema.getTableType, actualColumn, expectedColumn)
    })
  }

  private def assertColumn(tableType: TableType, actualColumn: Column, expectedColumn: Column): Unit = {
    expectedColumn match {
      case _: NestedColumn => assert(actualColumn.isInstanceOf[StringColumn])
      case _: ArrayColumn  => assert(actualColumn.isInstanceOf[StringColumn])
      case _: BoolColumn   => assert(actualColumn.isInstanceOf[Int8Column])
      case _               => assert(actualColumn.getClass == expectedColumn.getClass)
    }
    assert(actualColumn.name == expectedColumn.name)
    assert(actualColumn.description == expectedColumn.description)
    assert(actualColumn.displayName == expectedColumn.displayName)
    assert(actualColumn.isNullable == expectedColumn.isNullable)
  }

  private def assertColumnNames(columnNames: Set[String]): Unit = {
    assert(columnNames.nonEmpty)
    assert(columnNames.size == 17)
    assert(columnNames.contains("id"))
    assert(columnNames.contains("age"))
    assert(columnNames.contains("height"))
    assert(columnNames.contains("weight"))
    assert(columnNames.contains("salary"))
    assert(columnNames.contains("total_money"))
    assert(columnNames.contains("is_active"))
    assert(columnNames.contains("unit_car"))
    assert(columnNames.contains("unit_cat"))
    assert(columnNames.contains("unit_dog"))
    assert(columnNames.contains("unit_bee"))
    assert(columnNames.contains("unit_tiger"))
    assert(columnNames.contains("birth_day"))
    assert(columnNames.contains("marriage_time"))
    assert(columnNames.contains("address"))
    assert(columnNames.contains("hobbies"))
  }

  private def createTable(dbName: String, name: String): TableSchema = {
    val columns: Seq[Column] = Seq(
      StringColumn("id", "id", isNullable = false),
      Int8Column("age", "age", defaultValue = Some(12), isNullable = true),
      Int16Column("height", "height", isNullable = true),
      Int32Column("weight", "weight", isNullable = true),
      Int64Column("salary", "salary", isNullable = false),
      DoubleColumn("annual_salary", "annual_salary", isNullable = true),
      FloatColumn("total_money", "total_money", isNullable = true),
      BoolColumn("is_active", "is_active", isNullable = true),
      UInt8Column("unit_car", "unit_car", isNullable = true),
      UInt16Column("unit_cat", "unit_cat", isNullable = true),
      UInt16Column("unit_dog", "unit_dog", isNullable = true),
      UInt32Column("unit_bee", "unit_bee", isNullable = true),
      UInt64Column("unit_tiger", "unit_tiger", isNullable = true),
      DateColumn("birth_day", "birth_day", isNullable = true),
      DateTimeColumn("marriage_time", "marriage_time", isNullable = true),
      NestedColumn(
        "address",
        "address",
        nestedColumns = Seq(
          StringColumn("street", "street"),
          StringColumn("city", "city"),
          StringColumn("country", "country")
        ),
        isNullable = true
      ),
      ArrayColumn("hobbies", "hobbies", column = StringColumn("hobby", "hobby"), isNullable = true)
    )
    TableSchema(
      organizationId = 1,
      dbName = dbName,
      name = name,
      tableType = Some(TableType.Default),
      columns = columns,
      displayName = name
    )
  }

  private def testExistTable(dbName: String, name: String, expected: Boolean): Unit = {
    try {
      val query = s"select 1 from ${dbName}.${name} limit 1"
      client.executeQuery(query)(rs => rs.next())
      assert(expected == true)
    } catch {
      case e: TestFailedException => throw e
      case e: Exception => {
        e.printStackTrace()
        assert(expected == false)
      }
    }
  }

}
