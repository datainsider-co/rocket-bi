package co.datainsider.schema.service

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.schema.domain.column.{DoubleColumn, StringColumn, UInt32Column}
import co.datainsider.schema.domain.requests.{CreateTableFromQueryRequest, DeleteDBRequest, ListDBRequest}
import co.datainsider.schema.domain.responses.ListDatabaseResponse
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaTestModule}
import co.datainsider.schema.repository.SchemaRepository
import com.twitter.finagle.http.Request
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfter

/**
  * @author tvc12 - Thien Vi
  * @created 05/06/2021 - 6:22 PM
  */
class SchemaServiceTest extends IntegrationTest with BeforeAndAfter {
  private val newTableName = "testing";

  override protected val injector: Injector =
    TestInjector(TestModule, SchemaTestModule, MockCaasClientModule, TestContainerModule, MockSchemaClientModule)
      .newInstance();
  lazy val schemaService: SchemaService = injector.instance[SchemaService]
  val schemaRepository: SchemaRepository = injector.instance[SchemaRepository]

  val orgId = 1L
  val username = "tvc12"
  val baseRequest: Request = MockUserContext.getLoggedInRequest(orgId, username)

  override def beforeAll(): Unit = {
    super.beforeAll()
    await(
      schemaRepository.createDatabase(
        DatabaseSchema(
          name = "db_test_1",
          organizationId = 1,
          displayName = "Db test 1",
          creatorId = "abc",
          createdTime = 0,
          updatedTime = 0,
          tables = Seq()
        )
      )
    )
    await(
      schemaRepository.createDatabase(
        DatabaseSchema(
          name = "db_test_2",
          organizationId = 1,
          displayName = "Db test 2",
          creatorId = "abc",
          createdTime = 0,
          updatedTime = 0,
          tables = Seq()
        )
      )
    )
    await(
      schemaRepository.createTable(
        1,
        TableSchema(
          name = "tbl_test",
          dbName = "db_test_1",
          organizationId = 1,
          displayName = "table test",
          columns = Seq(StringColumn(name = "c0", displayName = "c0", isNullable = true))
        )
      )
    )
  }

  override def afterAll(): Unit = {
    super.afterAll()
    await(schemaService.deleteDatabase(orgId, "db_test_1"))
    await(schemaService.deleteDatabase(orgId, "db_test_2"))
  }

  override def beforeEach(): Unit = {
    super.beforeEach()
    try {
      await(schemaService.deleteTableSchema(orgId, "org1_org1_5milion", newTableName))
      await(schemaService.deleteTableSchema(orgId, "db_test_1", newTableName))
    } catch {
      case ex: Throwable => // ignored
    }
  }

  test("Detect columns type OK with SELECT 1") {
    val result = Await.result(schemaService.detectColumns(orgId, "select 1"))
    assertResult(expected = true)(result.nonEmpty)
    assertResult(expected = 1)(result.length)
    val column = result.head;
    assertResult(expected = "1")(column.displayName)
    assertResult(expected = "1")(column.name)
    assertResult(expected = false)(column.isNullable)
  }

  test("Detect columns type OK with SELECT now() as `Current Time`, 'Today is good' as `Message`") {
    val result =
      Await.result(schemaService.detectColumns(orgId, "SELECT now() as `Current Time`, 'Today is good' as `Message`"))
    assertResult(expected = true)(result.nonEmpty)
    assertResult(expected = 2)(result.length)
    val column1 = result.head;
    assertResult(expected = "Current Time")(column1.name)
    assertResult(expected = "Current Time")(column1.displayName)
    assertResult(expected = false)(column1.isNullable)

    val column2 = result.last;
    assertResult(expected = "Message")(column2.name)
    assertResult(expected = "Message")(column2.displayName)
    assertResult(expected = false)(column2.isNullable)
  }

  test("Detect columns type OK with SELECT * from db_test_1.tbl_test") {
    val result = Await.result(schemaService.detectColumns(orgId, "SELECT * from db_test_1.tbl_test"))
    assertResult(expected = true)(result.nonEmpty)
    assertResult(expected = 1)(result.length)
  }

  test("Detect columns type with wrong syntax") {
    val result = schemaService.detectColumns(orgId, "SELECT")
    result.onSuccess(_ => assert(false))
  }

  test("Drop DATABASE is NOT WORKING") {
    val result = schemaService.detectColumns(orgId, "drop database org1_org1_5milion;")
    result.onSuccess(_ => assert(false))
  }

  test("Drop TABLE is NOT WORKING") {
    val result = schemaService.detectColumns(orgId, "drop table org1_org1_5milion.data;")
    result.onSuccess(_ => assert(false))
  }

  test("Create table from select 1") {
    val newTableName = "select_one"
    val query = "select 1 as `c1`"
    val request = new CreateTableFromQueryRequest("db_test_1", newTableName, "Testing", query = query, request = baseRequest)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
    assertResult(expected = "db_test_1")(result.dbName)
    assertResult(expected = newTableName)(result.name)
    assertResult(expected = "Testing")(result.displayName)
    assertResult(expected = true)(result.columns.nonEmpty)
    assertResult(expected = 1)(result.columns.length)

    val columns = Await.result(schemaService.detectColumns(orgId, s"SELECT * from db_test_1.${newTableName}"))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 1)(columns.length)
  }

  test("Create table from SELECT now() as `Current Time`, 'Today is good' as `Message`") {
    val newTableName = "select_now"
    val query = "SELECT now() as `Current Time`, 'Today is good' as `Message`"
    val request = new CreateTableFromQueryRequest("db_test_1", newTableName, "Testing", query = query, request = baseRequest)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
    assertResult(expected = "db_test_1")(result.dbName)
    assertResult(expected = newTableName)(result.name)
    assertResult(expected = "Testing")(result.displayName)
    assertResult(expected = true)(result.columns.nonEmpty)
    assertResult(expected = 2)(result.columns.length)

    val columns = Await.result(schemaService.detectColumns(orgId, s"SELECT * from db_test_1.${newTableName}"))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 2)(columns.length)
  }

  test("Create table from select * from db_test_1.data") {
    val newTableName = "select_all"
    val query = "SELECT * from db_test_1.tbl_test limit 100"
    val request = new CreateTableFromQueryRequest("db_test_1", newTableName, "Testing", query = query, request = baseRequest)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
    assertResult(expected = "db_test_1")(result.dbName)
    assertResult(expected = newTableName)(result.name)
    assertResult(expected = "Testing")(result.displayName)
    assertResult(expected = true)(result.columns.nonEmpty)
    assertResult(expected = 1)(result.columns.length)

    val columns = Await.result(schemaService.detectColumns(orgId, s"SELECT * from db_test_1.${newTableName}"))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 1)(columns.length)
  }

  test("Test create view from query with wildcard select") {
    val query = "SELECT * from db_test_1.tbl_test limit 100"
    val request = new CreateTableFromQueryRequest("db_test_1", "dashboard_view", "Testing", query = query, request = baseRequest)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
  }

  test("Test create view from query with expression select") {
    val query = "SELECT c0 as `dashboard.id`, upper(c0) from db_test_1.tbl_test limit 100"
    val request = new CreateTableFromQueryRequest("db_test_1", "dashboard_view2", "Testing", query = query, request = baseRequest)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
  }

  test("Test create view from query with mixed wildcard and expressions") {
    val query = "SELECT *, c0 as `dashboard.id`, upper(c0) from db_test_1.tbl_test limit 100"
    val request = new CreateTableFromQueryRequest("db_test_1", "dashboard_view3", "Testing", query = query, request = baseRequest)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
  }

  test("Test create table from TableSchema") {
    val tableSchema = TableSchema(
      dbName = "db_test_1",
      name = "students",
      displayName = "Students",
      organizationId = 1,
      columns = Seq(
        UInt32Column("id", "ID"),
        StringColumn("name", "Name")
      )
    )
    val createdSchema = schemaService.createTableSchema(tableSchema).syncGet()
    assert(createdSchema.columns.length == 2)
  }

  test("Test update table schema") {
    val newTableSchema = TableSchema(
      dbName = "db_test_1",
      name = "students",
      displayName = "Students",
      organizationId = 1,
      columns = Seq(
        UInt32Column("id", "ID"),
        StringColumn("name", "Name"),
        DoubleColumn("grade", "Grade")
      )
    )
    val updatedSchema = schemaService.updateTableSchema(1, newTableSchema).syncGet()
    assert(updatedSchema.columns.length == 3)
  }

  test("Test drop table from TableSchema") {
    val dropTableOk = schemaService.deleteTableSchema(1, "db_test_1", "students").syncGet()
    assert(dropTableOk)
  }

  test("Soft delete database") {
    val request = new DeleteDBRequest("db_test_1", baseRequest)
    val result = schemaService.removeDatabase(request).syncGet()
//    assert(result)
  }

  test("list my database") {
    val result: ListDatabaseResponse = schemaService.listDatabases(1, ListDBRequest(Some(1), baseRequest)).syncGet()
    assert(result.data.exists(_.database.name.equals("db_test_2")))
  }

  test("list my database with wrong org id") {
    val result: ListDatabaseResponse = schemaService.listDatabases(20, ListDBRequest(Some(1), baseRequest)).syncGet()
    assert(result.data.isEmpty)
  }

  test("list my trash database") {
    val result: ListDatabaseResponse = schemaService.listDeletedDatabases(1, ListDBRequest(Some(1), baseRequest)).syncGet()
//    assert(result.data.exists(_.database.name.equals("db_test_1")))
  }

  test("list trash database with wrong org id") {
    val result: ListDatabaseResponse = schemaService.listDeletedDatabases(3, ListDBRequest(Some(orgId), baseRequest)).syncGet()
//    assert(result.data.isEmpty)
  }

  test("Restore database fail") {
    schemaService.restoreDatabase(DeleteDBRequest("db_test_x", baseRequest)).syncGet()
    val result: ListDatabaseResponse = schemaService.listDatabases(orgId, new ListDBRequest(None, baseRequest)).syncGet()
//    assert(!result.data.exists(_.database.name.equals("db_test_1")))
  }

  test("Restore database") {
    schemaService.restoreDatabase(DeleteDBRequest("db_test_1", baseRequest)).syncGet()
    val result: ListDatabaseResponse = schemaService.listDatabases(orgId, new ListDBRequest(None, baseRequest)).syncGet()
//    assert(result.data.exists(_.database.name.equals("db_test_1")))
  }

  test("Drop database") {
    val deleteOk: Boolean = schemaService.deleteDatabase(orgId, "db_test_1").syncGet()
    assert(deleteOk)
  }
}
