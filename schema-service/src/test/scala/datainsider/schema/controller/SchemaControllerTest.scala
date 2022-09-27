package datainsider.schema.controller

import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.Injector
import com.twitter.inject.app.TestInjector
import com.twitter.inject.server.{EmbeddedTwitterServer, FeatureTest}
import datainsider.schema.TestServer
import datainsider.schema.domain.DatabaseSchema
import datainsider.schema.module.TestModule
import datainsider.schema.repository.SchemaRepository
import datainsider.schema.repository.SchemaRepository
import org.scalatest.BeforeAndAfterAll

class SchemaControllerTest extends FeatureTest with BeforeAndAfterAll{
  protected override val server = new EmbeddedHttpServer(new TestServer)

  val schemaRepository: SchemaRepository = server.injector.instance[SchemaRepository]

  override def beforeAll(): Unit = {
    super.beforeAll()
    try {
      await(schemaRepository.createDatabase(
        DatabaseSchema(
          name = "db_test_1",
          organizationId = 1,
          displayName = "Db test 1",
          creatorId = "abc",
          createdTime = 0,
          updatedTime = 0,
          tables = Seq()
        )
      ))
      await(schemaRepository.createDatabase(
        DatabaseSchema(
          name = "db_test_2",
          organizationId = 1,
          displayName = "Db test 2",
          creatorId = "abc",
          createdTime = 0,
          updatedTime = 0,
          tables = Seq()
        )
      ))
    } catch {
      case ex: Throwable => println(ex)
    }
  }

  override def afterAll(): Unit = {
    super.afterAll()

    try {
      await(schemaRepository.dropDatabase(1, "db_test_1"))
      await(schemaRepository.dropDatabase(1, "db_test_2"))
    } catch {
      case ex: Throwable => println(ex)
    }

  }

  //Must post column before delete
//  test("Test delete calculated column is ok"){
//    val r = server.httpDelete(
//      path = "/databases/analytics_1/tables/di_user_events/columns/newcost",
//      andExpect = Status.Ok
//    )
//    assert(r.getContentString()=="true")
//  }
//  test("Test delete calculated column is fails"){
//    val r = server.httpDelete(
//      path = "/databases/analytics_1/tables/di_user_events/columns/cost",
//    )
//    assert(r.getContentString() != null)
//  }

  test("Soft delete database") {
    val response = server.httpPut(
      path = "/databases/db_test_1/remove",
      putBody = "",
      andExpect = Status.Ok
    )
    assert(response.getContentString() != null)
    assert(response.getContentString() == "true")
  }

  test("List my database") {
    val r = server.httpGet(
      path = "/databases/my_data",
      andExpect = Status.Ok
    )
    assert(r.getContentString().contains("db_test_2"))
  }

  test("List trash database") {
    val r = server.httpGet(
      path = "/databases/trash",
      andExpect = Status.Ok
    )
    assert(r.getContentString().contains("db_test_1"))
  }

  test("Restore database") {
    val r = server.httpPut(
      path = "/databases/db_test_1/restore",
      putBody = """
          |{
          |   "organization_id": 1
          |}
          |""".stripMargin
    )
  }

  test("List my database again") {
    val r = server.httpGet(
      path = "/databases/my_data",
      andExpect = Status.Ok
    )
    assert(r.getContentString().contains("db_test_2"))
    assert(r.getContentString().contains("db_test_1"))
  }
}
