package datainsider.ingestion.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.JdbcClient
import datainsider.ingestion.controller.http.requests.{CreateTableFromQueryRequest, DeleteDBRequest, ListDBRequest}
import datainsider.ingestion.controller.http.responses.ListDatabaseResponse
import datainsider.ingestion.domain.{DatabaseSchema, StringColumn, TableSchema}
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.repository.SchemaRepository
import org.scalatest.BeforeAndAfter

/**
  * @author tvc12 - Thien Vi
  * @created 05/06/2021 - 6:22 PM
  */
class SchemaServiceTest extends IntegrationTest with BeforeAndAfter {
  private val newTableName = "testing";

  override protected val injector: Injector = TestInjector(TestModule).newInstance();
  lazy val schemaService: SchemaService = injector.instance[SchemaService]
  val schemaRepository: SchemaRepository = injector.instance[SchemaRepository]
  val client: JdbcClient = injector.instance[JdbcClient]

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
        ),
        true
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
        ),
        true
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
    client.executeUpdate("insert into `db_test_1`.`tbl_test` values('test')")
  }

  override def afterAll(): Unit = {
    super.afterAll()
    await(schemaService.deleteDatabase(1L, "db_test_1"))
    await(schemaService.deleteDatabase(1L, "db_test_2"))
  }

  override def beforeEach(): Unit = {
    super.beforeEach()
    try {
      await(schemaService.deleteTableSchema(1, "org1_org1_5milion", newTableName))
      await(schemaService.deleteTableSchema(1, "db_test_1", newTableName))
    } catch {
      case ex: Throwable => // ignored
    }
  }

  test("Detect columns type OK with SELECT 1") {
    val result = Await.result(schemaService.detectColumns("select 1"))
    assertResult(expected = true)(result.nonEmpty)
    assertResult(expected = 1)(result.length)
    val column = result.head;
    assertResult(expected = "1")(column.displayName)
    assertResult(expected = "1")(column.name)
    assertResult(expected = false)(column.isNullable)
  }

  test("Detect columns type OK with SELECT now() as `Current Time`, 'Today is good' as `Message`") {
    val result =
      Await.result(schemaService.detectColumns("SELECT now() as `Current Time`, 'Today is good' as `Message`"))
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
    val result = Await.result(schemaService.detectColumns("SELECT * from db_test_1.tbl_test"))
    assertResult(expected = true)(result.nonEmpty)
    assertResult(expected = 1)(result.length)
  }

  test("Detect columns type with wrong syntax") {
    val result = schemaService.detectColumns("SELECT")
    result.onSuccess(_ => assert(false))
  }

  test("Drop DATABASE is NOT WORKING") {
    val result = schemaService.detectColumns("drop database org1_org1_5milion;")
    result.onSuccess(_ => assert(false))
  }

  test("Drop TABLE is NOT WORKING") {
    val result = schemaService.detectColumns("drop table org1_org1_5milion.data;")
    result.onSuccess(_ => assert(false))
  }

  test("Create table from select 1") {
    val query = "select 1 as `c1`"
    val request = new MockCreateTableFromQueryRequest("db_test_1", newTableName, "Testing", query = query)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
    assertResult(expected = "db_test_1")(result.dbName)
    assertResult(expected = newTableName)(result.name)
    assertResult(expected = "Testing")(result.displayName)
    assertResult(expected = true)(result.columns.nonEmpty)
    assertResult(expected = 1)(result.columns.length)

    val columns = Await.result(schemaService.detectColumns(s"SELECT * from db_test_1.${newTableName}"))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 1)(columns.length)
  }

  test("Create table from SELECT now() as `Current Time`, 'Today is good' as `Message`") {
    val query = "SELECT now() as `Current Time`, 'Today is good' as `Message`"
    val request = new MockCreateTableFromQueryRequest("db_test_1", newTableName, "Testing", query = query)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
    assertResult(expected = "db_test_1")(result.dbName)
    assertResult(expected = newTableName)(result.name)
    assertResult(expected = "Testing")(result.displayName)
    assertResult(expected = true)(result.columns.nonEmpty)
    assertResult(expected = 2)(result.columns.length)

    val columns = Await.result(schemaService.detectColumns(s"SELECT * from db_test_1.${newTableName}"))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 2)(columns.length)
  }

  test("Create table from select * from db_test_1.data") {
    val query = "SELECT * from db_test_1.tbl_test limit 100"
    val request = new MockCreateTableFromQueryRequest("db_test_1", newTableName, "Testing", query = query)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
    assertResult(expected = "db_test_1")(result.dbName)
    assertResult(expected = newTableName)(result.name)
    assertResult(expected = "Testing")(result.displayName)
    assertResult(expected = true)(result.columns.nonEmpty)
    assertResult(expected = 1)(result.columns.length)

    val columns = Await.result(schemaService.detectColumns(s"SELECT * from db_test_1.${newTableName}"))
    assertResult(expected = true)(columns.nonEmpty)
    assertResult(expected = 1)(columns.length)
  }

  test("Test create view from query with wildcard select") {
    val query = "SELECT * from db_test_1.tbl_test limit 100"
    val request = new MockCreateTableFromQueryRequest("db_test_1", "dashboard_view", "Testing", query = query)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
  }

  test("Test create view from query with expression select") {
    val query = "SELECT c0 as `dashboard.id`, upper(c0) from db_test_1.tbl_test limit 100"
    val request = new MockCreateTableFromQueryRequest("db_test_1", "dashboard_view2", "Testing", query = query)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
  }

  test("Test create view from query with mixed wildcard and expressions") {
    val query = "SELECT *, c0 as `dashboard.id`, upper(c0) from db_test_1.tbl_test limit 100"
    val request = new MockCreateTableFromQueryRequest("db_test_1", "dashboard_view3", "Testing", query = query)
    val result = Await.result(schemaService.createTableSchema(request))
    assertResult(expected = true)(result != null)
  }

  test("Soft delete database") {
    val request = new MockDeleteDBRequest("db_test_1")
    val result = schemaService.removeDatabase(request).syncGet()
    assert(result)
  }

  test("list my database") {
    val result: ListDatabaseResponse = schemaService.listDatabases(1, new MockListDbRequest(1)).syncGet()
    assert(result.data.exists(_.database.name.equals("db_test_2")))
  }

  test("list my database with wrong org id") {
    val result: ListDatabaseResponse = schemaService.listDatabases(2, new MockListDbRequest(1)).syncGet()
    assert(result.data.isEmpty)
  }

  test("list my trash database") {
    val result: ListDatabaseResponse = schemaService.listDeletedDatabases(1, new MockListDbRequest(1)).syncGet()
    assert(result.data.exists(_.database.name.equals("db_test_1")))
  }

  test("list trash database with wrong org id") {
    val result: ListDatabaseResponse = schemaService.listDeletedDatabases(2, new MockListDbRequest(1)).syncGet()
    assert(result.data.isEmpty)
  }

  test("Restore database fail") {
    schemaService.restoreDatabase(new MockDeleteDBRequest("db_test_x")).syncGet()
    val result: ListDatabaseResponse = schemaService.listDatabases(1, new MockListDbRequest(1)).syncGet()
    assert(!result.data.exists(_.database.name.equals("db_test_1")))
  }

  test("Restore database") {
    schemaService.restoreDatabase(new MockDeleteDBRequest("db_test_1")).syncGet()
    val result: ListDatabaseResponse = schemaService.listDatabases(1, new MockListDbRequest(1)).syncGet()
    assert(result.data.exists(_.database.name.equals("db_test_1")))
  }
}

class MockListDbRequest(orgId: Long) extends ListDBRequest(Some(orgId), null) {
  override def currentUsername: String = "abc123"
}

class MockCreateTableFromQueryRequest(dbName: String, tblName: String, displayName: String, query: String)
    extends CreateTableFromQueryRequest(dbName = dbName, tblName = tblName, displayName = displayName, query = query) {
  override def currentOrganizationId: Option[Long] = Some(1L)

  override def organizationId: Long = 1L
}

class MockDeleteDBRequest(dbName: String) extends DeleteDBRequest(dbName = dbName) {
  override def currentOrganizationId: Option[Long] = Some(1L)
}
