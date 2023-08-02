//package co.datainsider.schema.controller
//
//import co.datainsider.bi.TestServer
//import co.datainsider.schema.domain.DatabaseSchema
//import co.datainsider.schema.module.SchemaTestModule
//import co.datainsider.schema.repository.SchemaRepository
//import com.twitter.finagle.http.Status
//import com.twitter.finatra.http.EmbeddedHttpServer
//import com.twitter.inject.Injector
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.server.FeatureTest
//
//class SchemaControllerTest extends FeatureTest {
//  override val server = new EmbeddedHttpServer(new TestServer)
//  val schemaRepository: SchemaRepository = injector.instance[SchemaRepository]
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    schemaRepository.createDatabase(
//      DatabaseSchema(
//        name = "db_test_1",
//        organizationId = 1,
//        displayName = "Db test 1",
//        creatorId = "abc",
//        createdTime = 0,
//        updatedTime = 0,
//        tables = Seq()
//      )
//    )
//    schemaRepository.createDatabase(
//      DatabaseSchema(
//        name = "db_test_2",
//        organizationId = 1,
//        displayName = "Db test 2",
//        creatorId = "abc",
//        createdTime = 0,
//        updatedTime = 0,
//        tables = Seq()
//      )
//    )
//  }
//
//  override def afterAll(): Unit = {
//    super.afterAll()
//    schemaRepository.dropDatabase(1, "db_test_1")
//    schemaRepository.dropDatabase(1, "db_test_2")
//  }
//
//  //Must post column before delete
////  test("Test delete calculated column is ok"){
////    val r = server.httpDelete(
////      path = "/databases/analytics_1/tables/di_user_events/columns/newcost",
////      andExpect = Status.Ok
////    )
////    assert(r.getContentString()=="true")
////  }
////  test("Test delete calculated column is fails"){
////    val r = server.httpDelete(
////      path = "/databases/analytics_1/tables/di_user_events/columns/cost",
////    )
////    assert(r.getContentString() != null)
////  }
//
//  // Todo: fix test case after add json utils into project
//  test("Soft delete database") {
//    val r = server.httpPut(
//      path = "/databases/db_test_1/remove",
//      putBody = """
//          |{
//          |   "organization_id": 1
//          |}
//          |""".stripMargin
//    )
//  }
//
//  test("List my database") {
//    val r = server.httpGet(
//      path = "/databases/my_data",
//      andExpect = Status.Ok
//    )
//    assert(r.getContentString().contains("db_test_2"))
//  }
//
//  test("List trash database") {
//    val r = server.httpGet(
//      path = "/databases/trash",
//      andExpect = Status.Ok
//    )
//    assert(r.getContentString().nonEmpty)
//  }
//
//  test("Restore database") {
//    val r = server.httpPut(
//      path = "/databases/db_test_1/restore",
//      putBody = """
//          |{
//          |   "organization_id": 1
//          |}
//          |""".stripMargin
//    )
//  }
//
//  test("List my database again") {
//    val r = server.httpGet(
//      path = "/databases/my_data",
//      andExpect = Status.Ok
//    )
//    assert(r.getContentString().contains("db_test_2"))
//    assert(r.getContentString().contains("db_test_1"))
//  }
//}
